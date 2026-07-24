from datetime import date

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from database import get_session
from models import (
    Employee,
    EmployeeRole,
    Medical,
    Positions,
    TransferRequest,
    transfer_status,
)
from schemas import (
    AppealDecisionPayload,
    DepartmentTransferResponse,
    ExemptionContextResponse,
)

router = APIRouter()


def get_user_id(current_employee_id: int = Header(..., alias="employee-id")) -> int:
    return current_employee_id


def get_current_med_officer(
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
    if "MED_OFFICER" not in user_roles and "med_officer" not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Medical Officer privileges required. You do not have the MED_OFFICER role.",
        )

    return employee


def _medical_appeal_statuses() -> list[str]:
    return [transfer_status.APPEALED.name]


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


def _get_medical_appeal_transfer(db: Session, transfer_id: int) -> TransferRequest:
    transfer = db.query(TransferRequest).options(
        joinedload(TransferRequest.employee)
        .joinedload(Employee.current_position)
        .joinedload(Positions.department)
    ).filter(
        TransferRequest.id == transfer_id,
        TransferRequest.status.in_(_medical_appeal_statuses()),
        TransferRequest.audit_notes.ilike("%medical%"),
    ).first()

    if not transfer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medical transfer appeal not found.",
        )

    return transfer


@router.get("/transfers", response_model=list[DepartmentTransferResponse])
def get_medical_appeal_transfers(
    db: Session = Depends(get_session),
    med_officer: Employee = Depends(get_current_med_officer),
):
    transfers = db.query(TransferRequest).options(
        joinedload(TransferRequest.employee)
        .joinedload(Employee.current_position)
        .joinedload(Positions.department)
    ).filter(
        TransferRequest.status.in_(_medical_appeal_statuses()),
        TransferRequest.audit_notes.ilike("%medical%"),
    ).all()

    return [_to_department_transfer_response(transfer) for transfer in transfers]


@router.get("/transfers/{transfer_id}/context", response_model=ExemptionContextResponse)
def get_medical_appeal_context(
    transfer_id: int,
    db: Session = Depends(get_session),
    med_officer: Employee = Depends(get_current_med_officer),
):
    transfer = _get_medical_appeal_transfer(db, transfer_id)

    medical_records = db.query(Medical).filter(
        Medical.employee_id == transfer.employee_id,
        Medical.is_approve == True,
    ).all()

    return {
        "medical_issues": [medical.issue for medical in medical_records if medical.issue],
        "board_exam_children": [],
    }


@router.patch("/transfers/{transfer_id}/appeal-decision")
def decide_medical_appeal(
    transfer_id: int,
    payload: AppealDecisionPayload,
    db: Session = Depends(get_session),
    med_officer: Employee = Depends(get_current_med_officer),
):
    transfer = _get_medical_appeal_transfer(db, transfer_id)

    if payload.decision == "ACCEPT_APPEAL":
        transfer.status = transfer_status.CANCELLED.name
    else:
        transfer.status = transfer_status.APPROVED.name

    current_notes = transfer.audit_notes or ""
    today_str = date.today().isoformat()
    transfer.audit_notes = (
        f"{current_notes} | [Medical Officer {payload.decision} - {today_str}]: "
        f"{payload.manager_notes}"
    )
    transfer.approved_by = med_officer.id

    db.commit()

    return {
        "message": f"Medical appeal decision recorded. Transfer is now {transfer.status}.",
        "transfer_id": transfer.id,
    }
