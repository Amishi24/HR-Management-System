from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_session
from models import Employee, EmployeeRole, Role
from schemas import LoginRequest, LoginResponse

router = APIRouter()

@router.post("/login", response_model=LoginResponse)
def login(
    request: LoginRequest,
    db: Session = Depends(get_session)
):

    employee = (
        db.query(Employee)
        .filter(Employee.id == request.employee_id)
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    emp_role = (
        db.query(EmployeeRole)
        .filter(EmployeeRole.emp_id == employee.id)
        .first()
    )

    if not emp_role:
        raise HTTPException(
            status_code=404,
            detail="Role not assigned"
        )

    role = (
        db.query(Role)
        .filter(Role.id == emp_role.role_id)
        .first()
    )

    return LoginResponse(
        employee_id=employee.id,
        employee_name=employee.name,
        role=role.role_name
    )