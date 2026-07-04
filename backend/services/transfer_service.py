from datetime import date, timedelta
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, and_
from models import (Dependent, Education, Employee, EmployeeRole, Medical, Role, Positions, 
                    Department, TenureRecord, EmployeeTenureCompletionView, TransferRequest, transfer_status )

class TransferService:

    @staticmethod
    def fetch_team_list(
        db: Session, 
        target_role_name: str, 
        allowed_employee_ids_query=None
    ):
        """
        Reusable logic to pull lightweight profile cards based on target role 
        and an optional subquery/list restriction.
        """
        stmt = (
            select(Employee)
            .join(EmployeeRole, Employee.id == EmployeeRole.emp_id)
            .join(Role, EmployeeRole.role_id == Role.id)
            .where(Role.role_name == target_role_name)
            .where(Employee.is_active == True)
            .options(
                joinedload(Employee.discipline),
                joinedload(Employee.current_position).joinedload(Positions.department)
            )
        )

        # Apply jurisdiction limitations if explicitly provided (used by Dept Head)
        if allowed_employee_ids_query is not None:
            stmt = stmt.where(Employee.id.in_(allowed_employee_ids_query))

        employees = db.execute(stmt).scalars().all()

        return [
            {
                "employee_id": emp.id,
                "employee_name": emp.name,
                "discipline": emp.discipline.name if emp.discipline else "Unassigned",
                "Assigned_department": emp.current_position.department.name if emp.current_position else "Unassigned",
                "is_active": emp.is_active
            }
            for emp in employees
        ]

    @staticmethod
    def fetch_member_details(db: Session, target_employee_id: int, allowed_employee_ids_query=None):
        """
        Aggregates timeline, tenure metrics, math definitions, and metadata for a single target profile.
        """
        # Security Gateway check
        if allowed_employee_ids_query is not None:
            exists = db.execute(select(Employee.id).where(
                Employee.id == target_employee_id, 
                Employee.id.in_(allowed_employee_ids_query)
            )).scalar()
            if not exists:
                raise HTTPException(status_code=403, detail="Target profile is outside your jurisdiction.")

        emp_data = db.query(Employee).options(
            joinedload(Employee.discipline),
            joinedload(Employee.dependents),
            joinedload(Employee.transfer_requests.and_(TransferRequest.status == transfer_status.PROPOSED.name))
        ).filter(Employee.id == target_employee_id).first()

        if not emp_data:
            raise HTTPException(status_code=404, detail="Employee record not found.")

        # Compute Tenure Tracking Records
        tenures_with_math = db.query(TenureRecord, EmployeeTenureCompletionView).join(
            EmployeeTenureCompletionView, TenureRecord.id == EmployeeTenureCompletionView.tenure_id
        ).options(
            joinedload(TenureRecord.position).joinedload(Positions.department),
            joinedload(TenureRecord.position).joinedload(Positions.location),
            joinedload(TenureRecord.assignments)
        ).filter(TenureRecord.employee_id == target_employee_id).order_by(TenureRecord.start_date.desc()).all()

        formatted_tenures = []
        for t_record, t_view in tenures_with_math:
            req_years = t_record.position.location.required_tenure_years if t_record.position and t_record.position.location else 2
            working_days_per_year = t_record.position.location.required_working_days_per_year if t_record.position and t_record.position.location else 240
            
            total_working_days_required = req_years * working_days_per_year
            calendar_days_served = t_view.time_served.days if t_view.time_served else 0
            working_days_served = int(calendar_days_served * (working_days_per_year / 365.25))
            remaining_working_days = total_working_days_required - working_days_served

            formatted_tenures.append({
                "id": t_record.id,
                "start_date": t_record.start_date,
                "end_date": t_record.end_date,
                "department_name": t_record.position.department.name if t_record.position else "Unknown",
                "location": t_view.city,
                "level": t_record.position.level if t_record.position else 0,
                "is_tenure_complete": t_view.is_tenure_complete,
                "time_served_days": working_days_served,
                "remaining_days": max(remaining_working_days, 0),
                "assignments": t_record.assignments
            })

        return {
            "id": emp_data.id,
            "name": emp_data.name,
            "email": emp_data.email,
            "DoB": emp_data.DoB,
            "DoRetirement": emp_data.DoRetirement,
            "domicile_state": emp_data.domicile_state,
            "discipline_name": emp_data.discipline.name if emp_data.discipline else None,
            "dependents": emp_data.dependents,
            "active_transfers": emp_data.transfer_requests,
            "tenures": formatted_tenures
        }

    @staticmethod
    def fetch_mandatory_alerts(db: Session, allowed_employee_ids_query=None):
        """
        Calculates windows for mandatory 9-10 year service markers.
        """
        nine_years_ago = date.today() - timedelta(days=365*9)
        ten_years_ago = date.today() - timedelta(days=365*10)

        stmt = (
            select(Employee)
            .join(TenureRecord)
            .where(and_(
                TenureRecord.end_date.is_(None),
                TenureRecord.start_date >= ten_years_ago,
                TenureRecord.start_date <= nine_years_ago
            ))
            .options(
                joinedload(Employee.tenure_records).joinedload(TenureRecord.position).joinedload(Positions.location),
                joinedload(Employee.tenure_records).joinedload(TenureRecord.position).joinedload(Positions.department)
            )
        )

        if allowed_employee_ids_query is not None:
            stmt = stmt.where(Employee.id.in_(allowed_employee_ids_query))

        mandatory_transfer_emp = db.execute(stmt).scalars().all()

        alerts = []
        for emp in mandatory_transfer_emp:
            active_tenure = next((t for t in emp.tenure_records if t.end_date is None), None)
            if active_tenure and active_tenure.position:
                days_served = (date.today() - active_tenure.start_date).days
                years_served = round(days_served / 365.25, 1)

                alerts.append({
                    "employee_id": emp.id,
                    "employee_name": emp.name,
                    "current_state": active_tenure.position.location.state,
                    "current_city": active_tenure.position.location.city,
                    "department_name": active_tenure.position.department.name,
                    "tenure_start_date": active_tenure.start_date,
                    "years_served": years_served,
                    "alert_type": "MANDATORY_9_YEAR_TRANSFER"
                })
        return alerts

    @staticmethod
    def initiate_transfer(db: Session, initiator_id: int, target_employee_id: int, reason: str, allowed_employee_ids_query=None):
        """
        Executes business rule validations (3-year lock-in constraint) 
        and creates a new transfer proposal record.
        """
        # 1. Jurisdiction Gateway Check
        if allowed_employee_ids_query is not None:
            is_valid = db.execute(select(Employee.id).where(
                Employee.id == target_employee_id, 
                Employee.id.in_(allowed_employee_ids_query)
            )).scalar()
            if not is_valid:
                raise HTTPException(status_code=403, detail="Employee not found in your jurisdiction.")

        # 2. Fetch target employee and their tenure history
        target_employee = db.query(Employee).options(
            joinedload(Employee.tenure_records)
        ).filter(Employee.id == target_employee_id).first()
        
        if not target_employee:
            raise HTTPException(status_code=404, detail="Employee record not found.")

        # 3. Find active tenure record
        active_tenure = next((t for t in target_employee.tenure_records if t.end_date is None), None)
        if not active_tenure:
            raise HTTPException(status_code=400, detail="Employee does not have an active tenure record.")

        # 4. Check the 3-year lock-in constraint rule (1095 days)
        three_years_ago = date.today() - timedelta(days=1095) 
        if active_tenure.start_date > three_years_ago:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Transfer blocked. Minimum 3-year lock-in rule not met."
            )

        # 5. Insert new TransferRequest proposal row
        new_transfer = TransferRequest(
            employee_id=target_employee_id,
            status=transfer_status.PROPOSED.name, 
            approved_by=initiator_id,
            audit_notes=reason,
            location_preferences=[] 
        )
        db.add(new_transfer)
        db.commit()
        
        return {
            "message": "Transfer initiated. Employee has been flagged to provide preferences.", 
            "transfer_id": new_transfer.id
        }

    @staticmethod
    def fetch_pending_transfers(db: Session, allowed_employee_ids_query=None):
        """
        Fetches pending transfers filtered by a jurisdiction query if provided (Dept Head),
        or fetches globally if None (Location Head).
        """
        stmt = (
            select(TransferRequest)
            .join(Employee, TransferRequest.employee_id == Employee.id)
            .options(
                joinedload(TransferRequest.employee)
                .joinedload(Employee.current_position)
                .joinedload(Positions.department)
            )
        )

        if allowed_employee_ids_query is not None:
            stmt = stmt.where(Employee.id.in_(allowed_employee_ids_query))

        transfers = db.execute(stmt).scalars().all()

        return [
            {
                "id": transfer.id,
                "status": transfer.status,
                "audit_notes": transfer.audit_notes,
                "location_preferences": transfer.location_preferences,
                "created_at": transfer.created_at,
                "updated_at": transfer.updated_at,
                "employee_id": transfer.employee.id,
                "employee_name": transfer.employee.name,
                "current_department": transfer.employee.current_position.department.name 
                if transfer.employee.current_position else "Unassigned"
            }
            for transfer in transfers
        ]

    @staticmethod
    def review_transfer(db: Session, transfer_id: int, reviewer_id: int, status_choice: str, review_notes: str, allowed_employee_ids_query=None):
        """
        Accepts or Rejects a PROPOSED transfer with custom business validation.
        """
        stmt = select(TransferRequest).where(TransferRequest.id == transfer_id)
        if allowed_employee_ids_query is not None:
            stmt = stmt.where(TransferRequest.employee_id.in_(allowed_employee_ids_query))

        transfer = db.execute(stmt).scalar_one_or_none()

        if not transfer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Transfer request not found or outside your jurisdiction."
            )

        if transfer.status != transfer_status.PROPOSED.name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Cannot review a transfer that is currently marked as '{transfer.status}'."
            )

        if status_choice == "APPROVED" and len(transfer.location_preferences) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot approve this transfer. The employee has not submitted their required location preferences."
            )

        transfer.status = status_choice
        transfer.approved_by = reviewer_id
        
        current_notes = transfer.audit_notes or ""
        today_str = date.today().isoformat()
        transfer.audit_notes = f"{current_notes} | [Reviewed {status_choice} - {today_str}]: {review_notes}"

        db.commit()
        return {"message": f"Transfer successfully marked as {status_choice}.", "transfer_id": transfer.id}

    @staticmethod
    def view_exemption_context(db: Session, transfer_id: int, allowed_employee_ids_query=None):
        """
        Privacy Gateway: Exposes sensitive details only during an active appeal window.
        """
        stmt = select(TransferRequest).where(TransferRequest.id == transfer_id)
        if allowed_employee_ids_query is not None:
            stmt = stmt.where(TransferRequest.employee_id.in_(allowed_employee_ids_query))

        transfer = db.execute(stmt).scalar_one_or_none()

        if not transfer or transfer.status != transfer_status.APPEALED.name:
            raise HTTPException(status_code=403, detail="Context unavailable. Transfer is not currently under appeal.")

        medical_records = db.execute(
            select(Medical).where(Medical.employee_id == transfer.employee_id, Medical.is_approve == True)
        ).scalars().all()
        
        board_children = db.execute(
            select(Dependent)
            .join(Education)
            .where(
                Dependent.employee_id == transfer.employee_id,
                Dependent.relation == "Child",
                Education.curr_class.in_([9, 11])
            )
        ).scalars().all()

        return {
            "medical_issues": [m.issue for m in medical_records if m.issue],
            "board_exam_children": [f"{c.full_name} (Class {c.education.curr_class})" for c in board_children]
        }

    @staticmethod
    def review_appeal(db: Session, transfer_id: int, reviewer_id: int, decision: str, manager_notes: str, allowed_employee_ids_query=None):
        """
        Finalizes an appealed transfer to either CANCELLED or back to PROPOSED.
        """
        stmt = select(TransferRequest).where(TransferRequest.id == transfer_id)
        if allowed_employee_ids_query is not None:
            stmt = stmt.where(TransferRequest.employee_id.in_(allowed_employee_ids_query))

        transfer = db.execute(stmt).scalar_one_or_none()

        if not transfer or transfer.status != transfer_status.APPEALED.name:
            raise HTTPException(status_code=400, detail="Transfer is not currently awaiting an appeal decision.")

        today_str = date.today().isoformat()
        current_notes = transfer.audit_notes or ""

        if decision == "ACCEPT_APPEAL":
            transfer.status = transfer_status.CANCELLED.name
            transfer.audit_notes = f"{current_notes} | [Appeal ACCEPTED - {today_str}]: {manager_notes}"
        else:
            transfer.status = transfer_status.PROPOSED.name
            transfer.audit_notes = f"{current_notes} | [Appeal REJECTED - {today_str}]: {manager_notes}"

        transfer.approved_by = reviewer_id
        db.commit()

        return {"message": f"Appeal decision recorded. Transfer status is now {transfer.status}."}