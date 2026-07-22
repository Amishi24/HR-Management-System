"""
Cycle Engine Service
====================
Builds a directed graph of transfer-eligible employees and finds the optimal
closed transfer cycle. Also provides atomic execution of a reviewed cycle.
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
    """Finds optimal closed transfer cycles and executes them atomically."""

    # ------------------------------------------------------------------
    # PUBLIC: get_optimal_transfer_cycle
    # ------------------------------------------------------------------
    @staticmethod
    def get_approved_employees(db: Session) -> list:
        """
        Return all active employees who have an APPROVED transfer request.
        Used to populate the Transfer Head's employee selector.
        """
        from sqlalchemy import select as sa_select
        approved_status = transfer_status.APPROVED.name
        emps = db.execute(
            sa_select(Employee)
            .options(
                joinedload(Employee.current_position).joinedload(Positions.location),
                joinedload(Employee.transfer_requests),
            )
            .where(Employee.is_active == True)
        ).scalars().unique().all()

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
                "current_location": emp.current_position.location.city
                    if emp.current_position.location else "Unknown",
                "current_level": emp.current_position.level,
                "location_preferences": approved_req.location_preferences or [],
                "request_id": approved_req.id,
            })
        result.sort(key=lambda x: x["employee_name"])
        return result

    # ------------------------------------------------------------------
    # PUBLIC: get_optimal_transfer_cycle
    # ------------------------------------------------------------------
    @staticmethod
    def get_optimal_transfer_cycle(
        db: Session,
        exempt_employee_ids: List[int] | None = None,
        max_cycle_length: int = 5,
        seed_employee_id: int | None = None,
    ) -> Optional[dict]:
        """
        Build a directed employee graph and return the single best cycle.

        If seed_employee_id is provided, only cycles containing that employee
        are considered. Returns None when no valid cycle exists.
        """
        if exempt_employee_ids is None:
            exempt_employee_ids = []

        # ── 1. Fetch candidate employees (APPROVED requests only) ────────
        approved_status = transfer_status.APPROVED.name

        emp_stmt = (
            select(Employee)
            .options(
                joinedload(Employee.current_position).joinedload(Positions.location),
                joinedload(Employee.current_position).joinedload(Positions.discipline),
                joinedload(Employee.discipline),
                joinedload(Employee.tenure_records).joinedload(TenureRecord.assignments),
                joinedload(Employee.transfer_requests),
            )
            .where(
                Employee.is_active == True,
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
            return None

        emp_map: Dict[int, Employee] = {e.id: e for e in candidates}
        pos_to_emp: Dict[int, int] = {
            e.current_position_id: e.id for e in candidates
        }

        # ── 2. Load rotation policies ────────────────────────────────────
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

        # ── 3. Build adjacency list ──────────────────────────────────────
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

                # Discipline match
                if emp_i.discipline_id != target_pos.discipline_id:
                    continue

                # Location preference match
                if target_pos.location_id not in prefs_i:
                    continue

                # Level gating
                policy = _get_policy(target_pos.location_id)
                promos = policy["promotions_allowed"]
                if target_pos.level in promos:
                    if emp_i.current_position.level not in (
                        target_pos.level,
                        target_pos.level - 1,
                    ):
                        continue
                else:
                    if emp_i.current_position.level != target_pos.level:
                        continue

                graph[emp_i.id].append(emp_j.id)

        # ── 4. Find simple cycles (Johnson-style DFS) ────────────────────
        all_cycles: List[List[int]] = []
        nodes = sorted(graph.keys())

        for start in nodes:
            visited: Set[int] = set()
            stack: List[Tuple[int, List[int]]] = [(start, [start])]

            while stack:
                current, path = stack.pop()

                for neighbour in graph.get(current, []):
                    if neighbour == start and len(path) >= 2:
                        if len(path) <= max_cycle_length:
                            # Normalize: rotate so smallest id is first
                            min_idx = path.index(min(path))
                            normalized = path[min_idx:] + path[:min_idx]
                            if normalized not in all_cycles:
                                all_cycles.append(normalized)
                        continue

                    if neighbour in visited or neighbour in path:
                        continue

                    if neighbour <= start:
                        # Avoid duplicates: only extend to nodes > start
                        continue

                    if len(path) < max_cycle_length:
                        stack.append((neighbour, path + [neighbour]))

                visited.add(current)

        if not all_cycles:
            return None

        # ── 5. Filter by seed employee if specified ───────────────────────
        if seed_employee_id is not None:
            all_cycles = [c for c in all_cycles if seed_employee_id in c]
            if not all_cycles:
                return None

        # ── 6. Score all valid cycles ──────────────────────────────────────

        # ── 6. Score each cycle ──────────────────────────────────────────
        model = NLPModelManager().get_model()

        # Cache embeddings
        emp_text_cache: Dict[int, str] = {}
        pos_text_cache: Dict[int, str] = {}
        emp_emb_cache = {}
        pos_emb_cache = {}

        def _get_emp_emb(emp: Employee):
            if emp.id not in emp_emb_cache:
                text = MatchingService._extract_employee_assignments_text(emp)
                emp_text_cache[emp.id] = text
                emp_emb_cache[emp.id] = model.encode(text, convert_to_tensor=True) if text.strip() else None
            return emp_emb_cache[emp.id]

        def _get_pos_emb(pos_id: int):
            if pos_id not in pos_emb_cache:
                text = MatchingService._extract_position_history_text(db, pos_id)
                pos_text_cache[pos_id] = text
                pos_emb_cache[pos_id] = model.encode(text, convert_to_tensor=True) if text.strip() else None
            return pos_emb_cache[pos_id]

        def _edge_score(from_emp_id: int, to_emp_id: int) -> float:
            emp_i = emp_map[from_emp_id]
            emp_j = emp_map[to_emp_id]
            e_emb = _get_emp_emb(emp_i)
            p_emb = _get_pos_emb(emp_j.current_position_id)
            if e_emb is None or p_emb is None:
                return 0.0
            return float(util.cos_sim(e_emb, p_emb).item())

        def _tenure_years(emp: Employee) -> float:
            active = next((t for t in emp.tenure_records if t.end_date is None), None)
            if not active:
                return 0.0
            return (date.today() - active.start_date).days / 365.25

        best_cycle = None
        best_priority = -1.0

        for cycle in all_cycles:
            edge_scores = []
            tenure_vals = []
            for i in range(len(cycle)):
                from_id = cycle[i]
                to_id = cycle[(i + 1) % len(cycle)]
                edge_scores.append(_edge_score(from_id, to_id))
                tenure_vals.append(_tenure_years(emp_map[from_id]))

            overall = sum(edge_scores) / len(edge_scores) if edge_scores else 0.0
            avg_tenure = sum(tenure_vals) / len(tenure_vals) if tenure_vals else 0.0
            priority = overall + 0.05 * avg_tenure - 0.01 * len(cycle)

            if priority > best_priority:
                best_priority = priority
                best_cycle = (cycle, edge_scores, tenure_vals, overall)

        if best_cycle is None:
            return None

        cycle_ids, edge_scores, tenure_vals, overall_score = best_cycle

        # Rotate so the seed employee is first
        if seed_employee_id is not None and seed_employee_id in cycle_ids:
            idx = cycle_ids.index(seed_employee_id)
            cycle_ids = cycle_ids[idx:] + cycle_ids[:idx]
            edge_scores = edge_scores[idx:] + edge_scores[:idx]
            tenure_vals = tenure_vals[idx:] + tenure_vals[:idx]

        # ── 7. Build response ────────────────────────────────────────────
        # Pre-fetch location names
        loc_ids = set()
        for eid in cycle_ids:
            emp = emp_map[eid]
            loc_ids.add(emp.current_position.location_id)

        locations = {
            loc.id: loc.city
            for loc in db.execute(
                select(Location).where(Location.id.in_(list(loc_ids)))
            ).scalars().all()
        }

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
                "match_score": round(edge_scores[i], 4),
                "tenure_years": round(tenure_vals[i], 2),
            })

        return {
            "cycle_id": str(uuid.uuid4()),
            "overall_score": round(overall_score, 4),
            "cycle_length": len(cycle_ids),
            "exempted_employee_ids": list(exempt_employee_ids),
            "steps": steps,
        }

    # ------------------------------------------------------------------
    # PUBLIC: execute_transfer_cycle
    # ------------------------------------------------------------------
    @staticmethod
    def execute_transfer_cycle(db: Session, steps: List[dict]) -> dict:
        """
        Atomically execute a reviewed transfer cycle.

        Collects all mappings first, validates, then applies in a single
        savepoint so that partial failures roll back cleanly.
        """
        if not steps:
            raise ValueError("No steps provided for execution.")

        # ── 1. Collect and validate ──────────────────────────────────────
        transfer_plan: List[Tuple[Employee, int, int]] = []  # (emp, old_pos, new_pos)

        for step in steps:
            emp = db.get(Employee, step["from_employee_id"])
            if emp is None:
                raise ValueError(
                    f"Employee {step['from_employee_id']} not found."
                )
            if emp.current_position_id != step["from_position_id"]:
                raise ValueError(
                    f"Employee {emp.name} (ID {emp.id}) is no longer at position "
                    f"{step['from_position_id']}. Current: {emp.current_position_id}."
                )
            transfer_plan.append((emp, step["from_position_id"], step["to_position_id"]))

        # ── 2. Apply inside a savepoint ──────────────────────────────────
        nested = db.begin_nested()
        try:
            for emp, old_pos_id, new_pos_id in transfer_plan:
                # Close current active tenure
                active_tenure = next(
                    (t for t in emp.tenure_records if t.end_date is None), None
                )
                if active_tenure:
                    active_tenure.end_date = date.today()

                # Update position assignment
                emp.current_position_id = new_pos_id

                # Load target position for location_id
                target_pos = db.get(Positions, new_pos_id)
                if target_pos is None:
                    raise ValueError(f"Target position {new_pos_id} not found.")

                # Create new tenure record
                new_tenure = TenureRecord(
                    employee_id=emp.id,
                    position_id=new_pos_id,
                    location_id=target_pos.location_id,
                    start_date=date.today(),
                )
                db.add(new_tenure)

                # Mark the APPROVED transfer request as COMPLETED
                approved_req = next(
                    (
                        r
                        for r in emp.transfer_requests
                        if r.status == transfer_status.APPROVED.name
                    ),
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
