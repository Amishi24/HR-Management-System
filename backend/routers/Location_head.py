from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func
from typing import List

from fastapi import Header
from database import get_session 
from models import Department, Discipline, Employee, EmployeeRole, Positions, Location, Role, RotationPolicy, policy_scope, DepartmentDisciplineCapacity, TransferRequest
from schemas import AppealDecisionPayload, DepartmentLookupResponse, DepartmentTransferResponse, DetailedEmployeeResponse, DisciplineLookupResponse, ExemptionContextResponse, LightTeamEmployeeResponse, LocationDetailsResponse, PositionCreateRequest, PositionDetailsResponse, PositionUpdateRequest, RotationPolicyCreateUpdate, RotationPolicyResponse, TransferAlertResponse, TransferInitiatePayload, TransferReviewPayload, UpdateLocationRequirementsRequest, SuccessorSuggestionResponse, PositionSuggestionResponse
from services.transfer_service import TransferService
from services.matching_service import MatchingService

router = APIRouter()


def get_user_id(current_employee_id: int = Header(..., alias="employee-id")) -> int:
    return current_employee_id

def get_current_location_record(db: Session, current_user_id: int = Depends(get_user_id)) -> Location:
    subquery = (
        select(Positions.location_id)
        .join(Employee, Employee.current_position_id == Positions.id)
        .where(Employee.id == current_user_id)
        .scalar_subquery()
    )
    location = db.execute(select(Location).where(Location.id == subquery)).scalar_one_or_none()
    
    if not location:
        raise HTTPException(status_code=404, detail="No location assigned to this employee.")
    return location


def get_loc_head_jurisdiction_query(loc_head: Employee, db: Session):
    """
    Returns a subquery of Employee IDs who are Department Heads 
    stationed exactly at the Location Head's specific location.
    """
    head_loc_id = loc_head.current_position.location_id
    
    jurisdiction_query = db.query(Employee.id).join(
        Positions, Employee.current_position_id == Positions.id
    ).join(
        EmployeeRole, Employee.id == EmployeeRole.emp_id
    ).join(
        Role, EmployeeRole.role_id == Role.id
    ).filter(
        Positions.location_id == head_loc_id,
        Role.role_name.in_(["dept_head", "DEPT_HEAD"]),
        Employee.id != loc_head.id,
        Employee.is_active == True
    )
    
    return jurisdiction_query


@router.get("/my-location", response_model=LocationDetailsResponse)
def get_my_location(
    db: Session = Depends(get_session),
    current_user_id: int = Depends(get_user_id),
):
    return get_current_location_record(db, current_user_id)


@router.patch("/my-location/requirements")
def update_my_location_requirements(
    payload: UpdateLocationRequirementsRequest,
    db: Session = Depends(get_session),
    current_user_id: int = Depends(get_user_id),
):
    location = get_current_location_record(db, current_user_id)
    
    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=400, 
            detail="Update failed: No fields provided to update."
        )
    
    for field, value in update_data.items():
        setattr(location, field, value)
        
    db.commit()
    return {"Location requirements updated successfully"}


@router.get("/my-location/positions", response_model=List[PositionDetailsResponse])
def get_my_location_positions(
    db: Session = Depends(get_session),
    current_user_id: int = Depends(get_user_id),
):
    """
    Returns all positions under the logged-in location head's location.
    """
    
    location = get_current_location_record(db, current_user_id)

    stmt = (
        select(
            Positions.id,
            Department.name.label("department_name"),
            Discipline.name.label("discipline_name"),
            Positions.level,
            Positions.is_vacant
        )
        .join(Department, Positions.department_id == Department.id)
        .outerjoin(Discipline, Positions.discipline_id == Discipline.id) 
        .where(Positions.location_id == location.id)
    )

    results = db.execute(stmt).mappings().all()
    return results


def validate_department_and_discipline(db: Session, department_id: int | None, discipline_id: int | None):
    """
    Helper function to verify if the department and discipline IDs exist in the database.
    """
    # 1. Check Department if provided
    if department_id is not None:
        dept_exists = db.execute(
            select(Department.id).where(Department.id == department_id)
        ).scalar_one_or_none()
        
        if not dept_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Validation Error: Department ID {department_id} does not exist."
            )

    # 2. Check Discipline if provided (since it's optional, only check if it has a value)
    if discipline_id is not None:
        disc_exists = db.execute(
            select(Discipline.id).where(Discipline.id == discipline_id)
        ).scalar_one_or_none()
        
        if not disc_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Validation Error: Discipline ID {discipline_id} does not exist."
            )


def validate_position_capacity(
    db: Session, 
    department_id: int, 
    discipline_id: int | None, 
    level: int
):
    """
    Ensures that creating a new position does not exceed the globally 
    authorized max_strength for that specific Department + Discipline + Level.
    """
    if discipline_id is None:
        return

    capacity_record = db.execute(
        select(DepartmentDisciplineCapacity).where(
            DepartmentDisciplineCapacity.department_id == department_id,
            DepartmentDisciplineCapacity.discipline_id == discipline_id,
            DepartmentDisciplineCapacity.level == level
        )
    ).scalar_one_or_none()

    if not capacity_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot create position. No budget/capacity has been allocated for Level {level} in this Discipline."
        )


    current_count = db.execute(
        select(func.count(Positions.id)).where(
            Positions.department_id == department_id,
            Positions.discipline_id == discipline_id,
            Positions.level == level
        )
    ).scalar()

    if current_count >= capacity_record.max_strength:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Capacity exceeded. Max authorized strength for this Level is {capacity_record.max_strength}. "
                   f"There are already {current_count} positions allocated."
        )


@router.post("/my-location/positions", status_code=status.HTTP_201_CREATED)
def create_position(
    payload: PositionCreateRequest,
    db: Session = Depends(get_session),
    current_user_id: int = Depends(get_user_id),
):
    location = get_current_location_record(db, current_user_id)

    validate_department_and_discipline(db, payload.department_id, payload.discipline_id)

    validate_position_capacity(db, payload.department_id, payload.discipline_id, payload.level)

    new_position = Positions(
        level=payload.level,
        department_id=payload.department_id,
        discipline_id=payload.discipline_id,
        is_vacant=payload.is_vacant,
        location_id=location.id 
    )

    db.add(new_position)
    db.commit()
    return {"status": "success", "message": "Position created successfully"}


@router.patch("/my-location/positions/{position_id}")
def update_position(
    position_id: int,
    payload: PositionUpdateRequest,
    db: Session = Depends(get_session),
    current_user_id: int = Depends(get_user_id),
):
    location = get_current_location_record(db, current_user_id)

    stmt = select(Positions).where(Positions.id == position_id, Positions.location_id == location.id)
    position = db.execute(stmt).scalar_one_or_none()

    if not position:
        raise HTTPException(status_code=404, detail="Position not found or unauthorized.")

    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update.")

    validate_department_and_discipline(
        db, 
        update_data.get("department_id"), 
        update_data.get("discipline_id")
    )

    validate_position_capacity(db, payload.department_id, payload.discipline_id, payload.level)

    for field, value in update_data.items():
        setattr(position, field, value)

    db.commit()
    return {"status": "success", "message": f"Position {position_id} updated successfully"}


@router.delete("/my-location/positions/{position_id}")
def delete_position(
    position_id: int,
    db: Session = Depends(get_session),
    current_user_id: int = Depends(get_user_id),
):
    """
    Deletes a position, ensuring it belongs to the current location head.
    """
    location = get_current_location_record(db, current_user_id)

    stmt = select(Positions).where(Positions.id == position_id, Positions.location_id == location.id)
    position = db.execute(stmt).scalar_one_or_none()

    if not position:
        raise HTTPException(status_code=404, detail="Position not found or unauthorized to delete.")

    db.delete(position)
    db.commit()
    return {"message" : f"Position {position_id} deleted successfully."}


@router.get("/departments", response_model=list[DepartmentLookupResponse])
def get_all_departments(db: Session = Depends(get_session)):
    stmt = select(Department).order_by(Department.name.asc())
    departments = db.execute(stmt).scalars().all()
    return departments

@router.get("/disciplines", response_model=list[DisciplineLookupResponse])
def get_all_disciplines(db: Session = Depends(get_session)):
    stmt = select(Discipline).order_by(Discipline.name.asc())
    disciplines = db.execute(stmt).scalars().all()
    return disciplines

# ==========================================
#  ROTATION POLICY UNDER LOC_HEAD
# ==========================================

@router.get("/my-location/rotation-policy", response_model=RotationPolicyResponse | None)
def get_my_location_policy(
    db: Session = Depends(get_session),
    current_user_id: int = Depends(get_user_id),
):
    """
    Retrieves the local rotation policy for the current Location Head's site assignment.
    """
    location = get_current_location_record(db, current_user_id)
    
    stmt = select(RotationPolicy).where(
        RotationPolicy.scope_type == policy_scope.LOCAL.value,
        RotationPolicy.scope_id == location.id,
    )
    return db.execute(stmt).scalars().first()


@router.get("/global-policy", response_model=RotationPolicyResponse)
def get_global_policy(db: Session = Depends(get_session)):
    """Retrieves the default global rotation policy."""
    stmt = select(RotationPolicy).where(
        RotationPolicy.scope_type == policy_scope.GLOBAL.value,
        RotationPolicy.scope_id.is_(None),
    )
    policy = db.execute(stmt).scalars().first()
    if not policy:
        raise HTTPException(status_code=404, detail="Global rotation policy not found.")
    return policy


@router.post("/my-location/rotation-policy", response_model=RotationPolicyResponse, status_code=status.HTTP_201_CREATED)
def create_location_policy(
    payload: RotationPolicyCreateUpdate,
    db: Session = Depends(get_session),
    current_user_id: int = Depends(get_user_id),
):
    """
    Creates a new Local Rotation Policy. Scope Type is automatically assigned to 'LOCAL'
    and Scope ID defaults to the current Location Head's physical assignment location.
    """
    location = get_current_location_record(db, current_user_id)
    existing_policy = db.execute(
        select(RotationPolicy).where(
            RotationPolicy.scope_type == policy_scope.LOCAL.value,
            RotationPolicy.scope_id == location.id,
        )
    ).scalars().first()
    if existing_policy:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A local rotation policy already exists for this location.",
        )
    
    # Payload configuration mapped directly to DB object
    new_policy = RotationPolicy(
        scope_type=policy_scope.LOCAL.value,
        scope_id=location.id,
        rules_config=payload.rules_config.model_dump()
    )
    
    db.add(new_policy)
    db.commit()
    db.refresh(new_policy)
    return new_policy


@router.patch("/my-location/{policy_id}", response_model=RotationPolicyResponse)
def update_location_policy(
    policy_id: int,
    payload: RotationPolicyCreateUpdate,
    db: Session = Depends(get_session),
    current_user_id: int = Depends(get_user_id),
):
    """
    Modifies the rule configurations of an existing local site assignment rotation policy.
    Validates structural jurisdiction boundaries before mutation.
    """
    location = get_current_location_record(db, current_user_id)
    
    policy = db.get(RotationPolicy, policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Rotation policy record not found.")
        
    # Jurisdiction Check
    if policy.scope_type != policy_scope.LOCAL.value or policy.scope_id != location.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access Denied. This rotation policy belongs to an office outside your jurisdiction."
        )
        
    policy.rules_config = payload.rules_config.model_dump()
    db.commit()
    db.refresh(policy)
    return policy


@router.delete("/my-location/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_location_policy(
    policy_id: int,
    db: Session = Depends(get_session),
    current_user_id: int = Depends(get_user_id),
):
    """
    Removes a rotation policy from the database if it falls under the manager's jurisdiction.
    """
    location = get_current_location_record(db, current_user_id)
    
    policy = db.get(RotationPolicy, policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Rotation policy record not found.")
        
    # Jurisdiction Check
    if policy.scope_type != policy_scope.LOCAL.value or policy.scope_id != location.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access Denied. You do not have permissions to delete another location's policies."
        )
        
    db.delete(policy)
    db.commit()
    return None

# ==========================================
#  TRANSFER WORKFLOW
# ==========================================

# Simple dependency placeholder for checking the security role of your hardcoded Location Head
def get_current_loc_head(
    db: Session = Depends(get_session),
    current_user_id: int = Depends(get_user_id),
) -> Employee:
    employee = db.query(Employee).options(
        joinedload(Employee.employee_roles).joinedload(EmployeeRole.role),
        joinedload(Employee.current_position)
    ).filter(Employee.id == current_user_id).first()

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found.")

    user_roles = [er.role.role_name for er in employee.employee_roles if er.role]

    if "loc_head" not in user_roles and "LOC_HEAD" not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Elevated privileges required. You do not have the LOC_HEAD role."
        )

    return employee

@router.get("/team", response_model=list[LightTeamEmployeeResponse])
def get_all_department_heads_dashboard(
    db: Session = Depends(get_session),
    loc_head: Employee = Depends(get_current_loc_head)
):
    # Location Head sees ALL department at his location
    jurisdiction_query = get_loc_head_jurisdiction_query(loc_head, db)
    return TransferService.fetch_team_list(db, target_role_name="dept_head", allowed_employee_ids_query=jurisdiction_query)


@router.get("/team/{employee_id}", response_model=DetailedEmployeeResponse)
def get_department_head_details(
    employee_id: int,
    db: Session = Depends(get_session),
    loc_head: Employee = Depends(get_current_loc_head)
):
    # Global check over any target HOD record profile details
    jurisdiction_query = get_loc_head_jurisdiction_query(loc_head, db)
    return TransferService.fetch_member_details(db, employee_id, allowed_employee_ids_query=jurisdiction_query)


@router.get("/transfers/alerts", response_model=list[TransferAlertResponse])
def get_department_head_transfer_alerts(
    db: Session = Depends(get_session),
    loc_head: Employee = Depends(get_current_loc_head)
):
    jurisdiction_query = get_loc_head_jurisdiction_query(loc_head, db)
    return TransferService.fetch_mandatory_alerts(db, allowed_employee_ids_query=jurisdiction_query)


@router.post("/transfers/initiate", status_code=status.HTTP_201_CREATED)
def initiate_department_head_transfer(
    payload: TransferInitiatePayload,
    db: Session = Depends(get_session),
    loc_head: Employee = Depends(get_current_loc_head)
):
    """
    Allows a Location Head to initiate a structural transfer for a Department Head.
    Validates the 3-year organizational timeline requirement prior to approval.
    """
    # Passing allowed_employee_ids_query=None bypasses departmental tree filters,
    # giving the Location Head organization-wide authority over target records.
    jurisdiction_query = get_loc_head_jurisdiction_query(loc_head, db)
    return TransferService.initiate_transfer(
        db=db,
        initiator_id=loc_head.id,
        target_employee_id=payload.employee_id,
        reason=payload.reason,
        allowed_employee_ids_query=jurisdiction_query
    )

@router.get("/transfers", response_model=list[DepartmentTransferResponse])
def get_pending_department_head_transfers(
    db: Session = Depends(get_session),
    loc_head: Employee = Depends(get_current_loc_head)
):
    # Location Head sees transfers globally for all department heads without passing department filters
    jurisdiction_query = get_loc_head_jurisdiction_query(loc_head, db)
    return TransferService.fetch_pending_transfers(db, allowed_employee_ids_query=jurisdiction_query)


@router.patch("/transfers/{transfer_id}/review")
def review_department_head_transfer(
    transfer_id: int,
    payload: TransferReviewPayload,
    db: Session = Depends(get_session),
    loc_head: Employee = Depends(get_current_loc_head)
):
    jurisdiction_query = get_loc_head_jurisdiction_query(loc_head, db)
    return TransferService.review_transfer(
        db, transfer_id, loc_head.id, payload.status, payload.review_notes, 
        allowed_employee_ids_query=jurisdiction_query
    )


@router.get("/transfers/{transfer_id}/context", response_model=ExemptionContextResponse)
def view_department_head_exemption_context(
    transfer_id: int,
    db: Session = Depends(get_session),
    loc_head: Employee = Depends(get_current_loc_head)
):
    jurisdiction_query = get_loc_head_jurisdiction_query(loc_head, db)
    return TransferService.view_exemption_context(db, transfer_id, allowed_employee_ids_query=jurisdiction_query)


@router.patch("/transfers/{transfer_id}/appeal-decision")
def review_department_head_appeal(
    transfer_id: int,
    payload: AppealDecisionPayload,
    db: Session = Depends(get_session),
    loc_head: Employee = Depends(get_current_loc_head)
):
    
    jurisdiction_query = get_loc_head_jurisdiction_query(loc_head, db)
    return TransferService.review_appeal(
        db, transfer_id, loc_head.id, payload.decision, payload.manager_notes, 
        allowed_employee_ids_query=jurisdiction_query
    )


@router.get("/transfers/{transfer_id}/successor-suggestions", response_model=List[SuccessorSuggestionResponse])
def get_successor_suggestions(
    transfer_id: int,
    db: Session = Depends(get_session),
    loc_head: Employee = Depends(get_current_loc_head)
):
    jurisdiction_query = get_loc_head_jurisdiction_query(loc_head, db)
    allowed_ids = [r[0] for r in jurisdiction_query.with_entities(Employee.id).all()]
    
    transfer = db.query(TransferRequest).filter(TransferRequest.id == transfer_id).first()
    if not transfer or transfer.employee_id not in allowed_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden. Target transfer is outside your jurisdiction."
        )
        
    return MatchingService.suggest_successors(db, transfer_id=transfer_id, top_n=5)


@router.get("/transfers/{transfer_id}/position-suggestions", response_model=List[PositionSuggestionResponse])
def get_position_suggestions(
    transfer_id: int,
    db: Session = Depends(get_session),
    loc_head: Employee = Depends(get_current_loc_head)
):
    jurisdiction_query = get_loc_head_jurisdiction_query(loc_head, db)
    allowed_ids = [r[0] for r in jurisdiction_query.with_entities(Employee.id).all()]
    
    transfer = db.query(TransferRequest).filter(TransferRequest.id == transfer_id).first()
    if not transfer or transfer.employee_id not in allowed_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden. Target transfer is outside your jurisdiction."
        )
        
    return MatchingService.suggest_next_positions(db, transfer_id=transfer_id, top_n=5)


