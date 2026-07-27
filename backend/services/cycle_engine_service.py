"""
Cycle Engine Service
====================
Builds a directed graph of transfer-eligible employees for a specific discipline
and extracts the optimal, non-overlapping closed transfer cycles using a 
Greedy Selection algorithm prioritized strictly by NLP match scores.
"""

import uuid
from typing import List, Optional, Dict, Set, Tuple
from datetime import date

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select
from sentence_transformers import util

from models import (
    Employee, Positions, TransferRequest, TenureRecord,
    RotationPolicy, Location, transfer_status, policy_scope,
)
from services.matching_service import NLPModelManager, MatchingService


class CycleEngineService:
    """Finds optimal closed transfer cycles for a discipline and executes them atomically."""

    # ------------------------------------------------------------------
    # PUBLIC: get_approved_employees
    # ------------------------------------------------------------------
    @staticmethod
    def get_approved_employees(db: Session, discipline_id: Optional[int] = None) -> list:
        """
        Return active employees who have an APPROVED transfer request.
        Can be filtered by discipline for the Transfer Head's overview.
        """
        approved_status = transfer_status.APPROVED.name
        stmt = select(Employee).options(
            joinedload(Employee.current_position).joinedload(Positions.location),
            joinedload(Employee.transfer_requests),
            joinedload(Employee.discipline),
        ).where(Employee.is_active == True)

        if discipline_id is not None:
            stmt = stmt.where(Employee.discipline_id == discipline_id)

        emps = db.execute(stmt).scalars().unique().all()

        result = []
        for emp in emps:
            approved_req = next(
                (r for r in emp.transfer_requests if r.status == approved_status), None
            )
            if not approved_req or not emp.current_position:
                continue
            result.append({
                "employee_id": emp.id,
                "employee_name": emp.name,
                "discipline_id": emp.discipline_id,
                "discipline_name": emp.discipline.name if emp.discipline else "Unknown",
                "current_location": emp.current_position.location.city
                    if emp.current_position.location else "Unknown",
                "current_level": emp.current_position.level,
                "location_preferences": approved_req.location_preferences or [],
                "request_id": approved_req.id,
            })
        result.sort(key=lambda x: x["employee_name"])
        return result

    # ------------------------------------------------------------------
    # PUBLIC: get_optimal_transfer_cycles_for_discipline
    # ------------------------------------------------------------------
    @staticmethod
    def get_optimal_transfer_cycles_for_discipline(
        db: Session,
        discipline_id: int,
        exempt_employee_ids: List[int] | None = None,
        max_cycle_length: int = 5,
    ) -> List[dict]:
        """
        Builds a directed employee graph for an entire discipline, extracts all 
        valid closed loops, and uses a Greedy algorithm to return a list of 
        non-overlapping cycles prioritized by the highest NLP match scores.
        """
        if exempt_employee_ids is None:
            exempt_employee_ids = []

        # ── 1. Fetch candidate employees for the discipline ──────────────
        approved_status = transfer_status.APPROVED.name

        emp_stmt = (
            select(Employee)
            .options(
                joinedload(Employee.current_position).joinedload(Positions.location),
                joinedload(Employee.current_position).joinedload(Positions.discipline),
                joinedload(Employee.discipline),
                joinedload(Employee.transfer_requests),
            )
            .where(
                Employee.is_active == True,
                Employee.discipline_id == discipline_id,
                Employee.id.notin_(exempt_employee_ids) if exempt_employee_ids else True,
            )
        )
        employees = db.execute(emp_stmt).scalars().unique().all()

        # Keep only those with an APPROVED transfer request
        candidates: List[Employee] = []
        emp_approved_req: Dict[int, TransferRequest] = {}
        for emp in employees:
            approved = next(
                (r for r in emp.transfer_requests if r.status == approved_status),
                None,
            )
            if approved and emp.current_position:
                candidates.append(emp)
                emp_approved_req[emp.id] = approved

        if not candidates:
            return []

        emp_map: Dict[int, Employee] = {e.id: e for e in candidates}

        # ── 2. Load rotation policies (Level Gating) ─────────────────────
        global_gating = {"promotions_allowed": [], "lateral_only": []}
        global_policy = db.execute(
            select(RotationPolicy).where(
                RotationPolicy.scope_type == policy_scope.GLOBAL.value
            )
        ).scalars().first()
        if global_policy and global_policy.rules_config:
            lg = global_policy.rules_config.get("level_gating", {})
            global_gating["promotions_allowed"] = lg.get("promotions_allowed", [])
            global_gating["lateral_only"] = lg.get("lateral_only", [])

        local_policies = db.execute(
            select(RotationPolicy).where(
                RotationPolicy.scope_type == policy_scope.LOCAL.value
            )
        ).scalars().all()

        policies_by_location: Dict[int, dict] = {}
        for lp in local_policies:
            if lp.rules_config and "level_gating" in lp.rules_config:
                lg = lp.rules_config["level_gating"]
                policies_by_location[lp.scope_id] = {
                    "promotions_allowed": lg.get("promotions_allowed", []),
                    "lateral_only": lg.get("lateral_only", []),
                }

        def _get_policy(location_id: int) -> dict:
            return policies_by_location.get(location_id, global_gating)

        # ── 3. High-Performance NLP Batching ─────────────────────────────
        # Extract all texts upfront
        emp_texts = [MatchingService._extract_employee_assignments_text(emp) for emp in candidates]
        pos_texts = [MatchingService._extract_position_history_text(db, emp.current_position_id) for emp in candidates]

        model = NLPModelManager().get_model()
        
        # Run encode ONCE for all employees and ONCE for all positions
        emp_embs = model.encode(emp_texts, convert_to_tensor=True)
        pos_embs = model.encode(pos_texts, convert_to_tensor=True)

        emp_emb_map = {emp.id: emp_embs[i] for i, emp in enumerate(candidates)}
        pos_emb_map = {emp.current_position_id: pos_embs[i] for i, emp in enumerate(candidates)}

        def _edge_score(from_emp_id: int, to_emp_id: int) -> float:
            target_pos_id = emp_map[to_emp_id].current_position_id
            e_emb = emp_emb_map.get(from_emp_id)
            p_emb = pos_emb_map.get(target_pos_id)
            if e_emb is None or p_emb is None:
                return 0.0
            return float(util.cos_sim(e_emb, p_emb).item())

        # ── 4. Build Adjacency List ──────────────────────────────────────
        graph: Dict[int, List[int]] = {eid: [] for eid in emp_map}

        for emp_i in candidates:
            req_i = emp_approved_req[emp_i.id]
            prefs_i: List[int] = req_i.location_preferences or []
            if not prefs_i:
                continue

            for emp_j in candidates:
                if emp_i.id == emp_j.id:
                    continue

                target_pos = emp_j.current_position

                # Location preference match
                if target_pos.location_id not in prefs_i:
                    continue

                # Level gating
                policy = _get_policy(target_pos.location_id)
                promos = policy["promotions_allowed"]
                if target_pos.level in promos:
                    if emp_i.current_position.level not in (target_pos.level, target_pos.level - 1):
                        continue
                else:
                    if emp_i.current_position.level != target_pos.level:
                        continue

                graph[emp_i.id].append(emp_j.id)

        # ── 5. Find all Simple Cycles (DFS) ──────────────────────────────
        all_cycles: List[List[int]] = []
        nodes = sorted(graph.keys())

        for start in nodes:
            visited: Set[int] = set()
            stack: List[Tuple[int, List[int]]] = [(start, [start])]

            while stack:
                current, path = stack.pop()

                for neighbour in graph.get(current, []):
                    # Found a closed loop
                    if neighbour == start and len(path) >= 2:
                        if len(path) <= max_cycle_length:
                            # Normalize: rotate so smallest id is first to prevent dupes
                            min_idx = path.index(min(path))
                            normalized = path[min_idx:] + path[:min_idx]
                            if normalized not in all_cycles:
                                all_cycles.append(normalized)
                        continue

                    if neighbour in visited or neighbour in path:
                        continue

                    if neighbour <= start:
                        # Optimization: only extend to nodes > start to avoid redundant paths
                        continue

                    if len(path) < max_cycle_length:
                        stack.append((neighbour, path + [neighbour]))

                visited.add(current)

        if not all_cycles:
            return []

        # ── 6. Score all cycles ──────────────────────────────────────────
        scored_cycles = []
        for cycle in all_cycles:
            edge_scores = []
            for i in range(len(cycle)):
                from_id = cycle[i]
                to_id = cycle[(i + 1) % len(cycle)]
                edge_scores.append(_edge_score(from_id, to_id))

            overall_score = sum(edge_scores) / len(edge_scores) if edge_scores else 0.0
            scored_cycles.append((overall_score, cycle, edge_scores))

        # Sort strictly descending by overall NLP match score
        scored_cycles.sort(key=lambda x: x[0], reverse=True)

        # ── 7. Greedy Extraction ─────────────────────────────────────────
        # Extract the best cycles without overlapping employees
        final_cycles_output = []
        used_employees: Set[int] = set()

        # Pre-fetch all location names for the response formatting
        loc_ids = {emp.current_position.location_id for emp in candidates}
        locations = {
            loc.id: loc.city for loc in db.execute(
                select(Location).where(Location.id.in_(list(loc_ids)))
            ).scalars().all()
        }

        for score, cycle_ids, edge_scores in scored_cycles:
            # If any employee in this cycle is already claimed by a better cycle, skip it
            if any(eid in used_employees for eid in cycle_ids):
                continue

            # Mark these employees as used
            used_employees.update(cycle_ids)

            # Format the output steps for this cycle
            steps = []
            for i, eid in enumerate(cycle_ids):
                emp_i = emp_map[eid]
                next_eid = cycle_ids[(i + 1) % len(cycle_ids)]
                emp_j = emp_map[next_eid]
                
                steps.append({
                    "from_employee_id": emp_i.id,
                    "from_employee_name": emp_i.name,
                    "from_position_id": emp_i.current_position_id,
                    "from_location": locations.get(emp_i.current_position.location_id, "Unknown"),
                    "to_position_id": emp_j.current_position_id,
                    "to_location": locations.get(emp_j.current_position.location_id, "Unknown"),
                    "match_score": round(edge_scores[i], 4)
                })

            final_cycles_output.append({
                "cycle_id": str(uuid.uuid4()),
                "overall_score": round(score, 4),
                "cycle_length": len(cycle_ids),
                "steps": steps,
            })

        return final_cycles_output

    # ------------------------------------------------------------------
    # PUBLIC: execute_transfer_cycle
    # ------------------------------------------------------------------
    @staticmethod
    def execute_transfer_cycle(db: Session, steps: List[dict]) -> dict:
        """
        Atomically executes a reviewed transfer cycle (closed loop).
        """
        if not steps:
            raise ValueError("No steps provided for execution.")

        transfer_plan: List[Tuple[Employee, int, int]] = [] 

        for step in steps:
            emp = db.get(Employee, step["from_employee_id"])
            if emp is None:
                raise ValueError(f"Employee {step['from_employee_id']} not found.")
            if emp.current_position_id != step["from_position_id"]:
                raise ValueError(
                    f"Employee {emp.name} (ID {emp.id}) is no longer at position "
                    f"{step['from_position_id']}. Current: {emp.current_position_id}."
                )
            transfer_plan.append((emp, step["from_position_id"], step["to_position_id"]))

        nested = db.begin_nested()
        try:
            for emp, old_pos_id, new_pos_id in transfer_plan:
                active_tenure = next(
                    (t for t in emp.tenure_records if t.end_date is None), None
                )
                if active_tenure:
                    active_tenure.end_date = date.today()

                emp.current_position_id = new_pos_id
                target_pos = db.get(Positions, new_pos_id)
                
                new_tenure = TenureRecord(
                    employee_id=emp.id,
                    position_id=new_pos_id,
                    location_id=target_pos.location_id,
                    start_date=date.today(),
                )
                db.add(new_tenure)

                approved_req = next(
                    (r for r in emp.transfer_requests if r.status == transfer_status.APPROVED.name),
                    None,
                )
                if approved_req:
                    approved_req.status = transfer_status.COMPLETED.name
                    approved_req.to_position_id = new_pos_id

            db.commit()
        except Exception:
            nested.rollback()
            raise

        return {"status": "success", "transfers_completed": len(steps)}