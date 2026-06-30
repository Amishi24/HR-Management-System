from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload, aliased
from sqlalchemy import select
from datetime import date, timedelta

from database import get_session
# Note: Added EmployeeRole and Role to the imports
from models import Employee, Positions, Department, TransferRequest, TenureRecord, transfer_status, EmployeeRole, Role
from schemas import (TransferCreate, LightTeamEmployeeResponse, DetailedEmployeeResponse, TransferResponse, TransferReviewPayload, TransferAlertResponse, TransferInitiatePayload)

def get_user_id() -> int:
    return 10002589

router = APIRouter()

# ==========================================
# 1. SECURITY: The Updated RBAC Bouncer
# ==========================================
def get_current_dept_head(
        db: Session = Depends(get_session),
        current_user_id : int = Depends(get_user_id)
) -> Employee:
    
    employee = db.query(Employee).options(
        # FIX: We now jump across the Association Object (EmployeeRole) to get to the actual Role
        joinedload(Employee.employee_roles).joinedload(EmployeeRole.role),
        joinedload(Employee.current_position)
    ).filter(Employee.id == current_user_id).first()

    if not employee:
        raise HTTPException(
            status_code= status.HTTP_404_NOT_FOUND,
            detail = "Employee not found"
        )
    
    # FIX: Loop through the association objects to extract the role names
    user_roles = [er.role.role_name for er in employee.employee_roles if er.role]

    # Added a safeguard to check for both case variations depending on what you seed your DB with
    if "DEPT_HEAD" not in user_roles and "dept_head" not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Elevated privileges required. You do not have the DEPT_HEAD role."
        )
    
    if not employee.current_position:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department Head is not currently assigned to an active position/location."
        )

    return employee
    

def get_team_jurisdiction_query(dept_head: Employee, db: Session):
    head_loc_id = dept_head.current_position.location_id
    head_dept_id = dept_head.current_position.department_id

    hierarchy = db.query(Department.id).filter(
        Department.id == head_dept_id
    ).cte(name="dept_hierarchy", recursive=True)

    dept_alias = aliased(Department)
    hierarchy = hierarchy.union_all(
        db.query(dept_alias.id).filter(dept_alias.parent_id == hierarchy.c.id)
    )

    query = db.query(Employee).join(
        Positions, Employee.current_position_id == Positions.id
    ).filter(
        Positions.location_id == head_loc_id,
        Positions.department_id.in_(select(hierarchy.c.id))
    )
    
    return query


# ==========================================
# ROUTES: Team Visibility
# ==========================================
@router.get("/team", response_model=list[LightTeamEmployeeResponse])
def get_my_team(
    db: Session = Depends(get_session),
    dept_head: Employee = Depends(get_current_dept_head)
):
    base_query = get_team_jurisdiction_query(dept_head, db)

    employees = base_query.options(
        joinedload(Employee.discipline),
        joinedload(Employee.current_position).joinedload(Positions.department)
    ).all()

    response_data = []
    for emp in employees:
        response_data.append({
            "employee_id" : emp.id,
            "employee_name": emp.name,
            "discipline": emp.discipline.name if emp.discipline else "Unassigned",
            "Assigned_department": emp.current_position.department.name if emp.current_position else "Unassigned",
            "is_active": emp.is_active
        })

    return response_data


@router.get("/team/{employee_id}", response_model = DetailedEmployeeResponse)
def get_team_member_details(
    employee_id: int,
    db: Session = Depends(get_session),
    dept_head: Employee = Depends(get_current_dept_head)
):
    base_query = get_team_jurisdiction_query(dept_head, db)

    if not base_query.filter(Employee.id == employee_id).first():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employee not found or outside your departmental jurisdiction."
        )
    
    emp_data = db.query(Employee).options(
        joinedload(Employee.discipline),
        joinedload(Employee.current_position).joinedload(Positions.department),
        joinedload(Employee.dependents),
        joinedload(Employee.tenure_records).joinedload(TenureRecord.assignments),
        # FIX: Using the enum's .name to match the String mapping in models.py
        joinedload(Employee.transfer_requests.and_(TransferRequest.status == transfer_status.PROPOSED.name))
    ).filter(Employee.id == employee_id).first()

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
        "tenures" : [
            {
                "id": t.id,
                "start_date": t.start_date,
                "end_date": t.end_date,
                "department_name": t.position.department.name if t.position and t.position.department else "Unknown",
                "location": t.position.location.city if t.position and t.position.location else "Unknown",
                "level": t.position.level if t.position else 0,
                
                "time_served_days": 0, 
                "remaining_days": 0,
                "is_tenure_complete": False,
                
                "assignments": t.assignments
            } for t in emp_data.tenure_records
        ]
    }


# ==========================================
# ROUTES: Transfer Workflows
# ==========================================
@router.get("/transfers/alerts", response_model=list[TransferAlertResponse])
def get_mandatory_transfer_alerts(
    db : Session = Depends(get_session),
    dept_head : Employee = Depends(get_current_dept_head)
):
    base_query = get_team_jurisdiction_query(dept_head, db)

    nine_years_ago = date.today() - timedelta(days=365*9)
    ten_years_ago = date.today() - timedelta(days=365*10)

    mandatory_transfer_emp = base_query.options(
        joinedload(Employee.tenure_records).joinedload(TenureRecord.position).joinedload(Positions.location),
        joinedload(Employee.tenure_records).joinedload(TenureRecord.position).joinedload(Positions.department)
    ).join(TenureRecord).filter(
        TenureRecord.end_date == None,
        TenureRecord.start_date >= nine_years_ago,
        TenureRecord.start_date <= ten_years_ago
    ).all()

    alerts = []
    for emp in mandatory_transfer_emp:
        active_tenures = next((t for t in  emp.tenure_records if t.end_date is None), None)

        if active_tenures:
            days_served = (date.today() - active_tenures.start_date).days
            years_served = round(days_served / 365.25, 1)

            alerts.append(
                {
                    "employee_id" : emp.id,
                    "employee_name" : emp.name,
                    "current_state" : active_tenures.position.location.state if active_tenures.position else "Unknown",
                    "current_city" : active_tenures.position.location.city if active_tenures.position else "Unknown",
                    "department_name": active_tenures.position.department.name if active_tenures.position else "Unknown",
                    "tenure_start_date" : active_tenures.start_date,
                    "years_served": years_served,
                    "alert_type": "MANDATORY_9_YEAR_TRANSFER"
                }
            )

    return alerts


@router.post("/transfers/initiate", status_code=status.HTTP_201_CREATED)
def initiate_employee_transfer(
    payload: TransferInitiatePayload,
    db: Session = Depends(get_session),
    dept_head: Employee = Depends(get_current_dept_head)
):
    jurisdiction_query = get_team_jurisdiction_query(dept_head, db)
    target_employee = jurisdiction_query.options(
        joinedload(Employee.tenure_records)
    ).filter(Employee.id == payload.employee_id).first()

    if not target_employee:
        raise HTTPException(status_code=403, detail="Employee not found in your jurisdiction.")

    active_tenure = next((t for t in target_employee.tenure_records if t.end_date is None), None)
    if not active_tenure:
        raise HTTPException(status_code=400, detail="Employee does not have an active tenure record.")

    three_years_ago = date.today() - timedelta(days=1095) 
    if active_tenure.start_date > three_years_ago:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transfer blocked. Minimum 3-year lock-in rule not met."
        )

    new_transfer = TransferRequest(
        employee_id=payload.employee_id,
        # FIX: Ensure we use the string value since the DB column expects a String
        status=transfer_status.PROPOSED.name, 
        approved_by=dept_head.id,
        audit_notes=payload.reason,
        location_preferences=[] 
    )
    
    db.add(new_transfer)
    db.commit()
    
    return {
        "message": "Transfer initiated. Employee has been flagged to provide preferences.", 
        "transfer_id": new_transfer.id
    }


@router.get("/transfers", response_model=list[TransferResponse])
def get_pending_team_transfers(
    db: Session = Depends(get_session),
    dept_head: Employee = Depends(get_current_dept_head)
):
    pass

@router.patch("/transfers/{transfer_id}/review")
def review_transfer_request(
    transfer_id: int,
    payload: TransferReviewPayload,
    db: Session = Depends(get_session),
    dept_head: Employee = Depends(get_current_dept_head)
):
    pass

@router.get("/transfers/{transfer_id}/context")
def view_transfer_medical_education_context(
    transfer_id: int,
    db: Session = Depends(get_session),
    dept_head: Employee = Depends(get_current_dept_head)
):
    pass