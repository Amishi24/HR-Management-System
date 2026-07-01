from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload, aliased
from sqlalchemy import select, literal
from datetime import date, timedelta
from typing import List, Optional
from database import get_session
# Note: Added EmployeeRole and Role to the imports
from models import Employee, Positions, Department, TransferRequest, TenureRecord, transfer_status, EmployeeRole, Role, EmployeeTenureCompletionView
from schemas import (TransferCreate, LightTeamEmployeeResponse, DetailedEmployeeResponse, TransferResponse, TransferReviewPayload, TransferAlertResponse, TransferInitiatePayload,
                     SubDepartmentResponse,
                     DepartmentTransferResponse,
                     TransferReviewPayload
                     
                     )

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
    

def get_team_jurisdiction_query(
    dept_head: Employee, 
    db: Session, 
    target_department_id: Optional[int] = None
):
    """
    Builds the base query for employees in the jurisdiction.
    If target_department_id is provided, it securely scopes the query 
    to that specific department and its children.
    """
    head_loc_id = dept_head.current_position.location_id
    head_dept_id = dept_head.current_position.department_id

    # ---------------------------------------------------------
    # STEP 1: Find the True Root (Upward CTE)
    # ---------------------------------------------------------
    up_cte = select(Department.id, Department.parent_id).where(
        Department.id == head_dept_id
    ).cte(name="up_tree", recursive=True)

    parent_alias = aliased(Department)
    up_cte = up_cte.union_all(
        select(parent_alias.id, parent_alias.parent_id).where(
            parent_alias.id == up_cte.c.parent_id
        )
    )
    
    root_record = db.execute(select(up_cte.c.id).where(up_cte.c.parent_id.is_(None))).first()
    true_root_id = root_record[0] if root_record else head_dept_id

    # ---------------------------------------------------------
    # STEP 2: Find All Allowed Departments (Downward CTE)
    # ---------------------------------------------------------
    down_cte = select(Department.id).where(
        Department.id == true_root_id
    ).cte(name="down_tree", recursive=True)

    child_alias = aliased(Department)
    down_cte = down_cte.union_all(
        select(child_alias.id).where(child_alias.parent_id == down_cte.c.id)
    )
    
    allowed_dept_query = select(down_cte.c.id)

    # ---------------------------------------------------------
    # STEP 3: Handle the Frontend's Request securely
    # ---------------------------------------------------------
    if target_department_id:
        # SECURITY GATE: Verify the requested department is actually in their tree
        allowed_ids = [row[0] for row in db.execute(allowed_dept_query).all()]
        if target_department_id not in allowed_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Requested department is outside your jurisdiction."
            )
        
        # Build a new downward CTE starting exactly from the requested department
        target_cte = select(Department.id).where(
            Department.id == target_department_id
        ).cte(name="target_tree", recursive=True)
        
        target_child_alias = aliased(Department)
        target_cte = target_cte.union_all(
            select(target_child_alias.id).where(target_child_alias.parent_id == target_cte.c.id)
        )
        final_dept_filter = select(target_cte.c.id)
    else:
        # If no specific department was requested, use the whole allowed tree
        final_dept_filter = allowed_dept_query

    # ---------------------------------------------------------
    # STEP 4: Build and Return the Final Employee Query
    # ---------------------------------------------------------
    query = db.query(Employee).join(
        Positions, Employee.current_position_id == Positions.id
    ).filter(
        Positions.location_id == head_loc_id,
        Positions.department_id.in_(final_dept_filter),
        Employee.id != dept_head.id  
    )
    
    return query


# SubDepartments
@router.get("/departments", response_model=list[SubDepartmentResponse])
def get_my_departments(
    db: Session = Depends(get_session),
    dept_head: Employee = Depends(get_current_dept_head)
):
    """
    Finds the absolute root of the Department Head's jurisdiction, 
    then returns the entire tree hierarchically sorted by depth.
    """
    head_dept_id = dept_head.current_position.department_id

    # ---------------------------------------------------------
    # STEP 1: The Upward CTE (Find the True Root)
    # ---------------------------------------------------------
    up_cte = select(Department.id, Department.parent_id).where(
        Department.id == head_dept_id
    ).cte(name="up_tree", recursive=True)

    parent_alias = aliased(Department)
    up_cte = up_cte.union_all(
        select(parent_alias.id, parent_alias.parent_id).where(
            parent_alias.id == up_cte.c.parent_id
        )
    )

    # Execute upward search: the root is the one with no parent
    root_record = db.execute(
        select(up_cte.c.id).where(up_cte.c.parent_id.is_(None))
    ).first()
    

    true_root_id = root_record[0] if root_record else head_dept_id

    down_cte = select(
        Department.id,
        literal(0).label('depth') # Start depth counter at 0
    ).where(
        Department.id == true_root_id
    ).cte(name="down_tree", recursive=True)

    child_alias = aliased(Department)
    down_cte = down_cte.union_all(
        select(
            child_alias.id,
            (down_cte.c.depth + 1).label('depth') # Increment depth by 1
        ).where(
            child_alias.parent_id == down_cte.c.id
        )
    )


    departments_with_depth = db.query(Department, down_cte.c.depth).join(
        down_cte, Department.id == down_cte.c.id
    ).options(
        joinedload(Department.parent)
    ).order_by(
        down_cte.c.depth.asc(), 
        Department.name.asc()
    ).all()

    response_data = []
    for dept, depth in departments_with_depth:
        response_data.append({
            "id": dept.id,
            "name": dept.name,
            "parent_dept": dept.parent.name if dept.parent else None,
            "depth": depth
        })
        
    return response_data

# ==========================================
# ROUTES: Team Visibility
# ==========================================
@router.get("/team", response_model=list[LightTeamEmployeeResponse])
def get_my_team(
    department_id: Optional[int] = None,
    db: Session = Depends(get_session),
    dept_head: Employee = Depends(get_current_dept_head)
):
    base_query = get_team_jurisdiction_query(dept_head, db, target_department_id=department_id)

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


@router.get("/team/{employee_id}", response_model=DetailedEmployeeResponse)
def get_team_member_details(
    employee_id: int,
    db: Session = Depends(get_session),
    dept_head: Employee = Depends(get_current_dept_head)
):

    base_query = get_team_jurisdiction_query(dept_head, db)

    emp_data = base_query.options(
        joinedload(Employee.discipline),
        joinedload(Employee.dependents),
        joinedload(Employee.transfer_requests.and_(TransferRequest.status == transfer_status.PROPOSED.name))
    ).filter(Employee.id == employee_id).first()

    if not emp_data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employee not found or outside your departmental jurisdiction."
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
            "department_name": t_record.position.department.name if t_record.position else "Unknown",
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


# ROUTES: Transfer Workflows
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


@router.get("/transfers", response_model=list[DepartmentTransferResponse])
def get_pending_team_transfers(
    department_id: Optional[int] = None,
    db: Session = Depends(get_session),
    dept_head: Employee = Depends(get_current_dept_head)
):
    jurisdiction_query = get_team_jurisdiction_query(dept_head, db, target_department_id=department_id)

    transfers = db.query(TransferRequest).join(
        Employee, TransferRequest.employee_id == Employee.id
    ).filter(Employee.id.in_(jurisdiction_query.with_entities(Employee.id))).options(
        joinedload(TransferRequest.employee).joinedload(Employee.current_position).joinedload(Positions.department)
    ).all()

    response_data = []
    for transfer in transfers:
        response_data.append({
            "id": transfer.id,
            "status": transfer.status,
            "audit_notes": transfer.audit_notes,
            "location_preferences": transfer.location_preferences,
            "created_at": transfer.created_at,
            "updated_at": transfer.updated_at,
            "employee_id": transfer.employee.id,
            "employee_name": transfer.employee.name,
            "current_department": transfer.employee.current_position.department.name if transfer.employee.current_position else "Unassigned"
        })

    return response_data



@router.patch("/transfers/{transfer_id}/review")
def review_transfer_request(
    transfer_id: int,
    payload: TransferReviewPayload,
    db: Session = Depends(get_session),
    dept_head: Employee = Depends(get_current_dept_head)
):
    """
    Accepts or Rejects a PROPOSED transfer. 
    Strictly blocks approval if the employee hasn't submitted location preferences.
    """

    jurisdiction_query = get_team_jurisdiction_query(dept_head, db)
    allowed_employee_ids = jurisdiction_query.with_entities(Employee.id)

    transfer = db.query(TransferRequest).filter(
        TransferRequest.id == transfer_id,
        TransferRequest.employee_id.in_(allowed_employee_ids)
    ).first()

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

    if payload.status == "APPROVED" and len(transfer.location_preferences) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot approve this transfer. The employee has not submitted their required location preferences."
        )

    transfer.status = payload.status
    transfer.approved_by = dept_head.id
    
    current_notes = transfer.audit_notes or ""
    today_str = date.today().isoformat()
    transfer.audit_notes = f"{current_notes} | [Dept Head {payload.status} - {today_str}]: {payload.review_notes}"

    db.commit()

    return {
        "message": f"Transfer successfully marked as {payload.status}.",
        "transfer_id": transfer.id
    }


@router.get("/transfers/{transfer_id}/context")
def view_transfer_medical_education_context(
    transfer_id: int,
    db: Session = Depends(get_session),
    dept_head: Employee = Depends(get_current_dept_head)
):
    pass