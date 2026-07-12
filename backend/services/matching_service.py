from sentence_transformers import SentenceTransformer, util
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, or_, and_, exists, func
from fastapi import HTTPException
from models import Employee, TenureRecord, RotationPolicy, policy_scope, TransferRequest, Positions, DepartmentDisciplineCapacity, transfer_status
from datetime import date

class NLPModelManager:
    _instance = None
    _model = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(NLPModelManager, cls).__new__(cls, *args, **kwargs)
        return cls._instance

    def __init__(self):
        if NLPModelManager._model is None:
            NLPModelManager._model = SentenceTransformer("all-MiniLM-L6-v2")

    def get_model(self) -> SentenceTransformer:
        return self._model


# Load the model exactly once when the module loads
nlp_model_manager = NLPModelManager()


class MatchingService:

    @staticmethod
    def _extract_employee_assignments_text(employee: Employee) -> str:
        """
        Looks at an employee's active TenureRecord and combines all their 
        Assignment titles and skills into a single space-separated string.
        """
        active_tenure = next((t for t in employee.tenure_records if t.end_date is None), None)
        if not active_tenure:
            return ""
        
        parts = []
        for assignment in active_tenure.assignments:
            if assignment.title:
                parts.append(assignment.title)
            if assignment.skills:
                for skill in assignment.skills:
                    if skill:
                        parts.append(skill)
        return " ".join(parts)

    @staticmethod
    def _extract_position_history_text(db: Session, position_id: int) -> str:
        """
        Finds the most recent previous TenureRecord for a given position 
        and combines its assignments/skills into a string to act as the "Job Description".
        """
        stmt = (
            select(TenureRecord)
            .options(joinedload(TenureRecord.assignments))
            .where(TenureRecord.position_id == position_id)
            .where(TenureRecord.end_date.isnot(None))
            .order_by(TenureRecord.end_date.desc())
        )
        record = db.execute(stmt).scalars().first()
        if not record:
            return ""
        
        parts = []
        for assignment in record.assignments:
            if assignment.title:
                parts.append(assignment.title)
            if assignment.skills:
                for skill in assignment.skills:
                    if skill:
                        parts.append(skill)
        return " ".join(parts)

    @staticmethod
    def suggest_successors(db: Session, transfer_id: int, top_n: int = 5):
        """
        Suggests top N successors for a vacated position based on hard filters 
        (discipline, level, tenure limits) and soft NLP cosine similarity score matching.
        """
        # Step 1: Fetch the TransferRequest using transfer_id, including the target_employee and their current_position
        stmt = (
            select(TransferRequest)
            .options(
                joinedload(TransferRequest.employee)
                .joinedload(Employee.current_position)
            )
            .where(TransferRequest.id == transfer_id)
        )
        transfer_req = db.execute(stmt).scalar_one_or_none()

        if not transfer_req:
            raise HTTPException(status_code=404, detail="Transfer request not found.")

        employee = transfer_req.employee
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found on transfer request.")

        current_position = employee.current_position
        if not current_position:
            raise HTTPException(status_code=400, detail="Employee does not have a current position to find a successor for.")

        # Step 2: Fetch the RotationPolicy for this position's location to get level_gating and tenure_rules
        tenure_rules = {"min_tenure_years": 3, "max_tenure_years": 10}
        level_gating = {"lateral_only": [], "promotions_allowed": []}

        # 1. Global policy
        global_policy = db.execute(
            select(RotationPolicy).where(RotationPolicy.scope_type == policy_scope.GLOBAL.value)
        ).scalars().first()
        if global_policy and global_policy.rules_config:
            if "tenure_rules" in global_policy.rules_config:
                tenure_rules.update(global_policy.rules_config["tenure_rules"])
            if "level_gating" in global_policy.rules_config:
                level_gating.update(global_policy.rules_config["level_gating"])

        # 2. Local policy (if location_id exists)
        if current_position.location_id:
            local_policy = db.execute(
                select(RotationPolicy)
                .where(
                    RotationPolicy.scope_type == policy_scope.LOCAL.value,
                    RotationPolicy.scope_id == current_position.location_id
                )
            ).scalars().first()
            if local_policy and local_policy.rules_config:
                if "tenure_rules" in local_policy.rules_config:
                    tenure_rules.update(local_policy.rules_config["tenure_rules"])
                if "level_gating" in local_policy.rules_config:
                    level_gating.update(local_policy.rules_config["level_gating"])

        min_tenure_years = tenure_rules.get("min_tenure_years", 3)
        max_tenure_years = tenure_rules.get("max_tenure_years", 10)
        lateral_only = level_gating.get("lateral_only", [])
        promotions_allowed = level_gating.get("promotions_allowed", [])

        vacated_level = current_position.level
        allowed_levels = [vacated_level]
        if vacated_level in promotions_allowed:
            allowed_levels.append(vacated_level - 1)

        # Step 3 (Hard Filters): Query the Employee table for active employees
        candidates_stmt = (
            select(Employee)
            .options(
                joinedload(Employee.current_position),
                joinedload(Employee.tenure_records).joinedload(TenureRecord.assignments)
            )
            .where(Employee.is_active == True)
            .where(Employee.discipline_id == current_position.discipline_id)
            .where(Employee.id != employee.id)
        )
        candidates = db.execute(candidates_stmt).scalars().unique().all()

        filtered_candidates = []
        for cand in candidates:
            # Active TenureRecord's time served filter
            active_tenure = next((t for t in cand.tenure_records if t.end_date is None), None)
            if not active_tenure:
                continue

            days_served = (date.today() - active_tenure.start_date).days
            years_served = days_served / 365.25
            if years_served < min_tenure_years:
                continue

            # Current level filter
            if not cand.current_position or cand.current_position.level not in allowed_levels:
                continue

            filtered_candidates.append(cand)

        # Step 4 (Soft NLP Filter):
        # Use the helper to get the "Job Description" text of the outgoing employee's assignments.
        job_description = MatchingService._extract_position_history_text(db, current_position.id)
        if not job_description:
            job_description = MatchingService._extract_employee_assignments_text(employee)

        results = []
        if not filtered_candidates:
            return results

        if not job_description:
            # If no job description is available, set match score to 0.0 for all candidates
            for cand in filtered_candidates:
                active_tenure = next((t for t in cand.tenure_records if t.end_date is None), None)
                if active_tenure:
                    days_served = (date.today() - active_tenure.start_date).days
                    years_served = days_served / 365.25
                else:
                    years_served = 0.0
                is_overdue = years_served > max_tenure_years

                results.append({
                    "employee_id": cand.id,
                    "name": cand.name,
                    "current_level": cand.current_position.level,
                    "match_score": 0.0,
                    "is_overdue": is_overdue
                })
        else:
            model = NLPModelManager().get_model()
            candidate_texts = []
            for cand in filtered_candidates:
                candidate_texts.append(MatchingService._extract_employee_assignments_text(cand))

            # Encode job description and candidates
            job_desc_emb = model.encode(job_description, convert_to_tensor=True)
            cand_embs = model.encode(candidate_texts, convert_to_tensor=True)

            # Compute similarities
            cos_sims = util.cos_sim(job_desc_emb, cand_embs)
            scores = cos_sims.tolist()[0]

            for cand, score in zip(filtered_candidates, scores):
                active_tenure = next((t for t in cand.tenure_records if t.end_date is None), None)
                if active_tenure:
                    days_served = (date.today() - active_tenure.start_date).days
                    years_served = days_served / 365.25
                else:
                    years_served = 0.0
                is_overdue = years_served > max_tenure_years

                results.append({
                    "employee_id": cand.id,
                    "name": cand.name,
                    "current_level": cand.current_position.level,
                    "match_score": round(float(score), 2),
                    "is_overdue": is_overdue
                })

        # Step 5: Sort descending by is_overdue, then by match_score
        results.sort(key=lambda x: (x["is_overdue"], x["match_score"]), reverse=True)
        return results[:top_n]

    @staticmethod
    def suggest_next_positions(db: Session, transfer_id: int, top_n: int = 5):
        """
        Suggests top N positions for an employee to transfer to, based on vacancy, hard filters
        (discipline, preferred locations, and level gating), capacity limits, and soft NLP similarity.
        """
        # Step 1: Fetch the TransferRequest
        stmt = (
            select(TransferRequest)
            .options(
                joinedload(TransferRequest.employee)
                .joinedload(Employee.current_position)
            )
            .where(TransferRequest.id == transfer_id)
        )
        transfer_req = db.execute(stmt).scalar_one_or_none()

        if not transfer_req:
            raise HTTPException(status_code=404, detail="Transfer request not found.")

        employee = transfer_req.employee
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found on transfer request.")

        current_position = employee.current_position
        if not current_position:
            raise HTTPException(status_code=400, detail="Employee does not have a current position.")

        employee_level = current_position.level
        discipline_id = employee.discipline_id
        location_prefs = transfer_req.location_preferences or []
        if not location_prefs:
            return []

        # Step 2: Vacancy Filter Condition
        vacancy_cond = or_(
            Positions.is_vacant == True,
            exists().where(
                and_(
                    Employee.current_position_id == Positions.id,
                    TransferRequest.employee_id == Employee.id,
                    TransferRequest.status.in_([
                        transfer_status.APPROVED.name,
                        transfer_status.SUCCESSOR_ASSIGNED.name,
                        transfer_status.HANDOVER_IN_PROGRESS.name
                    ])
                )
            )
        )

        # Step 3: Hard Filters Query
        stmt = (
            select(Positions)
            .options(
                joinedload(Positions.department),
                joinedload(Positions.location)
            )
            .where(
                Positions.discipline_id == discipline_id,
                Positions.location_id.in_(location_prefs),
                vacancy_cond
            )
        )
        candidate_positions = db.execute(stmt).scalars().all()

        # Fetch global policy
        global_policy = db.execute(
            select(RotationPolicy).where(RotationPolicy.scope_type == policy_scope.GLOBAL.value)
        ).scalars().first()
        
        global_level_gating = {"lateral_only": [], "promotions_allowed": []}
        if global_policy and global_policy.rules_config and "level_gating" in global_policy.rules_config:
            global_level_gating.update(global_policy.rules_config["level_gating"])

        # Fetch local policies for all preferred locations
        local_policies = db.execute(
            select(RotationPolicy).where(
                RotationPolicy.scope_type == policy_scope.LOCAL.value,
                RotationPolicy.scope_id.in_(location_prefs)
            )
        ).scalars().all()

        # Map location_id -> level_gating
        policies_by_location = {}
        for loc_id in location_prefs:
            policies_by_location[loc_id] = {
                "lateral_only": list(global_level_gating.get("lateral_only", [])),
                "promotions_allowed": list(global_level_gating.get("promotions_allowed", []))
            }

        for policy in local_policies:
            if policy.rules_config and "level_gating" in policy.rules_config:
                policies_by_location[policy.scope_id] = {
                    "lateral_only": list(policy.rules_config["level_gating"].get("lateral_only", [])),
                    "promotions_allowed": list(policy.rules_config["level_gating"].get("promotions_allowed", []))
                }

        # Filter by level gating
        surviving_positions = []
        for pos in candidate_positions:
            policy = policies_by_location.get(pos.location_id, {
                "lateral_only": list(global_level_gating.get("lateral_only", [])),
                "promotions_allowed": list(global_level_gating.get("promotions_allowed", []))
            })
            lateral_only = policy.get("lateral_only", [])
            promotions_allowed = policy.get("promotions_allowed", [])

            if pos.level in promotions_allowed:
                if not (employee_level == pos.level or employee_level == pos.level - 1):
                    continue
            else:
                if employee_level != pos.level:
                    continue

            surviving_positions.append(pos)

        # Step 4: Capacity Filter
        final_surviving_positions = []
        if surviving_positions:
            dept_ids = {pos.department_id for pos in surviving_positions}
            levels = {pos.level for pos in surviving_positions}

            # Query capacities
            capacity_stmt = (
                select(DepartmentDisciplineCapacity)
                .where(
                    DepartmentDisciplineCapacity.discipline_id == discipline_id,
                    DepartmentDisciplineCapacity.department_id.in_(list(dept_ids)),
                    DepartmentDisciplineCapacity.level.in_(list(levels))
                )
            )
            capacities = db.execute(capacity_stmt).scalars().all()
            capacity_map = {
                (cap.department_id, cap.level): cap.max_strength
                for cap in capacities
            }

            # Query active headcounts: filled positions (is_vacant == False) for that dept/discipline/level
            headcount_stmt = (
                select(Positions.department_id, Positions.level, func.count(Positions.id))
                .where(
                    Positions.discipline_id == discipline_id,
                    Positions.department_id.in_(list(dept_ids)),
                    Positions.level.in_(list(levels)),
                    Positions.is_vacant == False
                )
                .group_by(Positions.department_id, Positions.level)
            )
            headcounts = db.execute(headcount_stmt).all()
            headcount_map = {
                (dept_id, lvl): count
                for dept_id, lvl, count in headcounts
            }

            for pos in surviving_positions:
                max_strength = capacity_map.get((pos.department_id, pos.level), 0)
                headcount = headcount_map.get((pos.department_id, pos.level), 0)
                if headcount >= max_strength:
                    continue
                final_surviving_positions.append(pos)

        # Step 5: Soft Ranking
        results = []
        if not final_surviving_positions:
            return results

        employee_text = MatchingService._extract_employee_assignments_text(employee)

        # Retrieve position history text for all surviving positions
        pos_texts = {}
        for pos in final_surviving_positions:
            txt = MatchingService._extract_position_history_text(db, pos.id)
            pos_texts[pos.id] = txt

        # Find non-empty texts to compare
        valid_pos_ids = [pos_id for pos_id, txt in pos_texts.items() if txt.strip()]

        scores_by_pos_id = {}
        if employee_text.strip() and valid_pos_ids:
            model = NLPModelManager().get_model()
            emp_emb = model.encode(employee_text, convert_to_tensor=True)
            target_texts = [pos_texts[pid] for pid in valid_pos_ids]
            pos_embs = model.encode(target_texts, convert_to_tensor=True)

            cos_sims = util.cos_sim(emp_emb, pos_embs)
            scores = cos_sims.tolist()[0]

            for pid, score in zip(valid_pos_ids, scores):
                scores_by_pos_id[pid] = round(float(score), 2)

        for pos in final_surviving_positions:
            preference_rank = location_prefs.index(pos.location_id) + 1
            nlp_match_score = scores_by_pos_id.get(pos.id, 0.0)

            results.append({
                "position_id": pos.id,
                "department_name": pos.department.name if pos.department else "Unknown",
                "location_id": pos.location_id,
                "preference_rank": preference_rank,
                "nlp_match_score": nlp_match_score
            })

        # Step 6: Return sorted results
        results.sort(key=lambda x: (x["preference_rank"], -x["nlp_match_score"]))
        return results[:top_n]
