"""
Transfer Head Router
====================
Endpoints for the Transfer Head role to generate, inspect, and execute
optimal transfer cycles, plus view a global overview of pending requests.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select
from pydantic import BaseModel
from datetime import date

from database import get_session
from models import (
    TransferRequest, Employee, Positions, Location, transfer_status,
    EmployeeRole, Role, TenureRecord, EmployeeTenureCompletionView,
    RotationPolicy, policy_scope, Department, Discipline
)
from services.cycle_engine_service import CycleEngineService
from services.transfer_service import TransferService
from schemas import (
    TransferInitiatePayload, ExemptionContextResponse, AppealDecisionPayload, DepartmentTransferResponse, DetailedEmployeeResponse
)

router = APIRouter()

def get_user_id(current_employee_id: int = Header(..., alias="employee-id")) -> int:
    return current_employee_id

def get_current_transfer_head(
    db: Session = Depends(get_session),
    current_user_id: int = Depends(get_user_id),
) -> Employee:
    employee = db.query(Employee).options(
        joinedload(Employee.employee_roles).joinedload(EmployeeRole.role)
    ).filter(Employee.id == current_user_id).first()

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    user_roles = [er.role.role_name for er in employee.employee_roles if er.role]
    if "TRANSFER_HEAD" not in user_roles and "transfer_head" not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Elevated privileges required. You do not have the TRANSFER_HEAD role.",
        )

    return employee



# ── Request / Response Schemas ───────────────────────────────────────────

class CycleGenerateRequest(BaseModel):
    discipline_id: int
    exempt_employee_ids: List[int] = []
    max_cycle_length: int = 5


class CycleExecuteRequest(BaseModel):
    steps: List[dict]


# ── Endpoints ────────────────────────────────────────────────────────────

@router.get("/approved-employees")
def get_approved_employees(
    db: Session = Depends(get_session),
    transfer_head: Employee = Depends(get_current_transfer_head),
):
    """List all employees with an APPROVED transfer request for the selector UI."""
    return CycleEngineService.get_approved_employees(db)


@router.post("/cycle/generate")
def generate_cycle(
    req: CycleGenerateRequest,
    db: Session = Depends(get_session),
    transfer_head: Employee = Depends(get_current_transfer_head),
):
    """Generate all optimal non-overlapping transfer cycles for a discipline."""
    cycles = CycleEngineService.get_optimal_transfer_cycles_for_discipline(
        db,
        discipline_id=req.discipline_id,
        exempt_employee_ids=req.exempt_employee_ids,
        max_cycle_length=req.max_cycle_length,
    )
    if not cycles:
        raise HTTPException(
            status_code=404,
            detail="No valid transfer cycles found for this discipline.",
        )
    return cycles


@router.post("/cycle/execute")
def execute_cycle(
    req: CycleExecuteRequest,
    db: Session = Depends(get_session),
    transfer_head: Employee = Depends(get_current_transfer_head),
):
    """Atomically execute a reviewed transfer cycle."""
    try:
        return CycleEngineService.execute_transfer_cycle(db, req.steps)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Cycle execution failed: {str(exc)}",
        )


@router.get("/requests/overview")
def requests_overview(
    db: Session = Depends(get_session),
    transfer_head: Employee = Depends(get_current_transfer_head),
):
    """
    Return all pending (non-COMPLETED, non-CANCELLED) transfer requests
    together with summary metrics.
    """
    active_statuses = [
        transfer_status.APPROVED.name,
        transfer_status.PROPOSED.name,
        transfer_status.APPEALED.name,
        transfer_status.SUCCESSOR_ASSIGNED.name,
        transfer_status.HANDOVER_IN_PROGRESS.name,
    ]

    stmt = (
        select(TransferRequest)
        .options(
            joinedload(TransferRequest.employee).joinedload(Employee.discipline),
            joinedload(TransferRequest.employee)
            .joinedload(Employee.current_position)
            .joinedload(Positions.location),
            joinedload(TransferRequest.employee)
            .joinedload(Employee.discipline),
        )
        .where(TransferRequest.status.in_(active_statuses))
        .order_by(TransferRequest.created_at.desc())
    )
    requests = db.execute(stmt).scalars().unique().all()

    # Pre-fetch all locations for preference resolution
    all_locations = {
        loc.id: loc.city
        for loc in db.execute(select(Location)).scalars().all()
    }

    proposed = 0
    approved = 0
    appealed = 0
    items = []

    for req in requests:
        if req.status == transfer_status.PROPOSED.name:
            proposed += 1
        elif req.status == transfer_status.APPROVED.name:
            approved += 1
        elif req.status == transfer_status.APPEALED.name:
            appealed += 1

        emp = req.employee
        current_city = "Unknown"
        if emp and emp.current_position and emp.current_position.location:
            current_city = emp.current_position.location.city

        pref_ids = req.location_preferences or []
        pref_cities = [all_locations.get(lid, f"ID:{lid}") for lid in pref_ids]

        items.append({
            "request_id": req.id,
            "employee_id": emp.id if emp else None,
            "employee_name": emp.name if emp else "Unknown",
            "discipline": emp.discipline.name if emp and emp.discipline else "Unassigned",
            "status": req.status,
            "current_location": current_city,
            "location_preferences": pref_ids,
            "preferred_cities": pref_cities,
            "is_th_initiated": req.approved_by is not None,
            "created_at": req.created_at.isoformat() if req.created_at else None,
        })

    return {
        "summary": {
            "total": len(items),
            "proposed": proposed,
            "approved": approved,
            "appealed": appealed,
        },
        "requests": items,
    }


@router.get("/transfers/eligible")
def get_eligible_employees(
    db: Session = Depends(get_session),
    transfer_head: Employee = Depends(get_current_transfer_head),
):
    """
    Returns all active employees across the entire organization who have 
    completed their required tenure (or are due for mandatory rotation).
    """
    eligible_rows = db.query(
        TenureRecord.employee_id.label("employee_id"),
        Employee.name.label("employee_name"),
        Employee.is_active.label("is_active"),
        Discipline.name.label("discipline_name"),
        Department.name.label("department_name"),
        Positions.level.label("level"),
        Positions.location_id.label("location_id"),
        EmployeeTenureCompletionView.city.label("city"),
        EmployeeTenureCompletionView.start_date.label("start_date"),
        EmployeeTenureCompletionView.time_served.label("time_served"),
    ).join(
        EmployeeTenureCompletionView,
        TenureRecord.id == EmployeeTenureCompletionView.tenure_id,
    ).join(
        Employee,
        TenureRecord.employee_id == Employee.id,
    ).join(
        Positions,
        TenureRecord.position_id == Positions.id,
    ).outerjoin(
        Department,
        Positions.department_id == Department.id,
    ).outerjoin(
        Discipline,
        Employee.discipline_id == Discipline.id,
    ).filter(
        Employee.is_active.is_(True),
        TenureRecord.end_date.is_(None),
        EmployeeTenureCompletionView.is_tenure_complete.is_(True),
    ).order_by(
        EmployeeTenureCompletionView.time_served.desc(),
    ).all()

    active_statuses = [
        transfer_status.PROPOSED.name,
        transfer_status.APPROVED.name,
        transfer_status.APPEALED.name,
        transfer_status.SUCCESSOR_ASSIGNED.name,
        transfer_status.HANDOVER_IN_PROGRESS.name
    ]
    employee_ids = [row.employee_id for row in eligible_rows]
    active_transfers = []
    if employee_ids:
        active_transfers = db.query(TransferRequest).filter(
            TransferRequest.employee_id.in_(employee_ids),
            TransferRequest.status.in_(active_statuses)
        ).all()
    active_transfers_map = {t.employee_id: t for t in active_transfers}

    policies = db.query(RotationPolicy).all()
    global_policy = next((p for p in policies if p.scope_type == policy_scope.GLOBAL.value), None)
    global_rules = (global_policy.rules_config or {}).get('tenure_rules', {}) if global_policy else {}
    local_policies = {p.scope_id: p for p in policies if p.scope_type == policy_scope.LOCAL.value}

    response_data = []
    for row in eligible_rows:
        active_t = active_transfers_map.get(row.employee_id)
        if active_t:
            continue

        calendar_days_served = row.time_served.days if row.time_served else 0
        years_served = round(calendar_days_served / 365.25, 1)

        rules = {"min_tenure_years": 3, "max_tenure_years": 10}
        rules.update(global_rules)
        local_policy = local_policies.get(row.location_id)
        local_rules = (local_policy.rules_config or {}).get('tenure_rules', {}) if local_policy else {}
        if local_rules:
            rules.update(local_rules)
        max_tenure_years = rules.get('max_tenure_years', 10)
        min_tenure_years = rules.get('min_tenure_years', 3)
        
        if years_served < min_tenure_years:
            continue
            
        is_mandatory_transfer = years_served >= max_tenure_years

        response_data.append({
            "employee_id": row.employee_id,
            "employee_name": row.employee_name,
            "discipline": row.discipline_name or "Unassigned",
            "department_name": row.department_name or "Unknown",
            "location": row.city,
            "level": row.level or 0,
            "years_served": years_served,
            "max_tenure_years": max_tenure_years,
            "is_mandatory_transfer": is_mandatory_transfer,
            "start_date": row.start_date,
            "is_active": row.is_active,
        })
    return response_data

@router.get("/employees/{employee_id}", response_model=DetailedEmployeeResponse)
def get_employee_details(
    employee_id: int,
    db: Session = Depends(get_session),
    transfer_head: Employee = Depends(get_current_transfer_head)
):
    emp_data = db.query(Employee).options(
        joinedload(Employee.discipline),
        joinedload(Employee.dependents),
        joinedload(Employee.transfer_requests.and_(TransferRequest.status == transfer_status.PROPOSED.name))
    ).filter(Employee.id == employee_id).first()

    if not emp_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found."
        )

    tenures_with_math = db.query(TenureRecord, EmployeeTenureCompletionView).join(
        EmployeeTenureCompletionView, TenureRecord.id == EmployeeTenureCompletionView.tenure_id
    ).options(
        joinedload(TenureRecord.position).joinedload(Positions.department),
        joinedload(TenureRecord.position).joinedload(Positions.location),
        joinedload(TenureRecord.assignments)
    ).filter(
        TenureRecord.employee_id == employee_id
    ).order_by(TenureRecord.start_date.desc()).all()

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
            "department_name": t_record.position.department.name if t_record.position and t_record.position.department else "Unknown",
            "location": t_view.city,
            "level": t_record.position.level if t_record.position else 0,
            "is_tenure_complete": t_view.is_tenure_complete,
            "time_served_days": working_days_served,
            "remaining_days": remaining_working_days if remaining_working_days > 0 else 0,
            
            "assignments": t_record.assignments
        })

    return {
        "id" : emp_data.id,
        "name" : emp_data.name,
        "email": emp_data.email,
        "DoB" : emp_data.DoB,
        "DoRetirement" : emp_data.DoRetirement,
        "domicile_state" : emp_data.domicile_state,
        "discipline_name" : emp_data.discipline.name if emp_data.discipline else None,
        "dependents": emp_data.dependents,
        "active_transfers": emp_data.transfer_requests,
        "tenures" : formatted_tenures
    }

@router.post("/transfers/initiate", status_code=status.HTTP_201_CREATED)
def initiate_employee_transfer(
    payload: TransferInitiatePayload,
    db: Session = Depends(get_session),
    transfer_head: Employee = Depends(get_current_transfer_head)
):
    return TransferService.initiate_transfer(
        db,
        initiator_id=transfer_head.id,
        target_employee_id=payload.employee_id,
        reason=payload.reason,
        allowed_employee_ids_query=None 
    )

@router.delete("/transfers/{transfer_id}", status_code=status.HTTP_200_OK)
def revoke_transfer_request(
    transfer_id: int,
    db: Session = Depends(get_session),
    transfer_head: Employee = Depends(get_current_transfer_head)
):
    transfer = db.query(TransferRequest).filter(
        TransferRequest.id == transfer_id
    ).first()
    
    if not transfer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transfer request not found."
        )
    
    if transfer.status != transfer_status.PROPOSED.name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail= f"Cannot revoke a transfer request that is marked as '{transfer.status}'."
        )

    if transfer.approved_by is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only transfer-head initiated transfer requests can be revoked here."
        )
    
    transfer.status = transfer_status.CANCELLED.name
    current_notes = transfer.audit_notes or ""
    today_str = date.today().isoformat()
    transfer.audit_notes = f"{current_notes} | [Transfer Head REVOKED request - {today_str}]"
    
    db.commit()

    return {"message": "Transfer request revoked successfully."}

@router.get("/transfers/voluntary", response_model=list[DepartmentTransferResponse])
def get_voluntary_transfers(
    db: Session = Depends(get_session),
    transfer_head: Employee = Depends(get_current_transfer_head),
):
    transfers = db.query(TransferRequest).options(
        joinedload(TransferRequest.employee)
        .joinedload(Employee.current_position)
        .joinedload(Positions.department)
    ).filter(
        TransferRequest.status == transfer_status.PROPOSED.name,
        TransferRequest.approved_by == None
    ).all()

    return [_to_department_transfer_response(transfer) for transfer in transfers]

@router.patch("/transfers/{transfer_id}/approve-voluntary")
def approve_voluntary_transfer(
    transfer_id: int,
    db: Session = Depends(get_session),
    transfer_head: Employee = Depends(get_current_transfer_head),
):
    transfer = db.query(TransferRequest).filter(
        TransferRequest.id == transfer_id,
        TransferRequest.status == transfer_status.PROPOSED.name,
        TransferRequest.approved_by == None
    ).first()

    if not transfer:
        raise HTTPException(status_code=404, detail="Voluntary transfer request not found or already processed.")

    if len(transfer.location_preferences) == 0:
        raise HTTPException(status_code=400, detail="Cannot approve: employee hasn't submitted location preferences.")

    transfer.status = transfer_status.APPROVED.name
    transfer.approved_by = transfer_head.id
    
    current_notes = transfer.audit_notes or ""
    today_str = date.today().isoformat()
    transfer.audit_notes = f"{current_notes} | [Transfer Head ACCEPTED voluntary request - {today_str}]"
    
    db.commit()
    return {"message": "Voluntary transfer request approved successfully."}

def _to_department_transfer_response(transfer: TransferRequest) -> dict:
    employee = transfer.employee
    current_position = employee.current_position if employee else None
    department = current_position.department if current_position else None

    return {
        "id": transfer.id,
        "status": transfer.status,
        "audit_notes": transfer.audit_notes,
        "location_preferences": transfer.location_preferences,
        "created_at": transfer.created_at,
        "updated_at": transfer.updated_at,
        "employee_id": employee.id if employee else transfer.employee_id,
        "employee_name": employee.name if employee else "Unknown",
        "current_department": department.name if department else "Unassigned",
    }

@router.get("/transfers/educational-appeals", response_model=list[DepartmentTransferResponse])
def get_educational_appeals(
    db: Session = Depends(get_session),
    transfer_head: Employee = Depends(get_current_transfer_head),
):
    transfers = db.query(TransferRequest).options(
        joinedload(TransferRequest.employee)
        .joinedload(Employee.current_position)
        .joinedload(Positions.department)
    ).filter(
        TransferRequest.status == transfer_status.APPEALED.name,
        TransferRequest.audit_notes.ilike("%education%"),
    ).all()

    return [_to_department_transfer_response(transfer) for transfer in transfers]

@router.get("/transfers/{transfer_id}/context", response_model=ExemptionContextResponse)
def get_educational_appeal_context(
    transfer_id: int,
    db: Session = Depends(get_session),
    transfer_head: Employee = Depends(get_current_transfer_head),
):
    return TransferService.view_exemption_context(db, transfer_id, allowed_employee_ids_query=None)


@router.patch("/transfers/{transfer_id}/appeal-decision")
def decide_educational_appeal(
    transfer_id: int,
    payload: AppealDecisionPayload,
    db: Session = Depends(get_session),
    transfer_head: Employee = Depends(get_current_transfer_head),
):
    transfer = db.query(TransferRequest).filter(
        TransferRequest.id == transfer_id,
        TransferRequest.status == transfer_status.APPEALED.name,
        TransferRequest.audit_notes.ilike("%education%")
    ).first()

    if not transfer:
        raise HTTPException(status_code=404, detail="Educational appeal not found or not in APPEALED state.")

    if payload.decision == "ACCEPT_APPEAL":
        transfer.status = transfer_status.CANCELLED.name
    else:
        transfer.status = transfer_status.APPROVED.name

    current_notes = transfer.audit_notes or ""
    today_str = date.today().isoformat()
    transfer.audit_notes = (
        f"{current_notes} | [Transfer Head {payload.decision} - {today_str}]: "
        f"{payload.manager_notes}"
    )
    transfer.approved_by = transfer_head.id

    db.commit()

    return {
        "message": f"Educational appeal decision recorded. Transfer is now {transfer.status}.",
        "transfer_id": transfer.id,
    }
