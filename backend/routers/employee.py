from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import date, timedelta

from database import get_session
from models import Employee, Dependent, TenureRecord, Positions, EmployeeTenureCompletionView
from schemas import EmployeeMeResponse, DependentResponse, TenureResponse

router = APIRouter()

def get_user_id() -> int:
    return 10000000

@router.get("", response_model = EmployeeMeResponse)
def get_profile(db : Session = Depends(get_session), current_user_id: int = Depends(get_user_id)):
    employee = db.query(Employee).options(joinedload(Employee.discipline)).filter(Employee.id == current_user_id).first()

    if not employee: 
        raise HTTPException(status_code=404, detail="Employee not found")
    
    return{
        "id": employee.id,
        "name": employee.name,
        "email": employee.email,
        "DoB": employee.DoB,
        "DoRetirement": employee.DoRetirement,
        "domicile_state": employee.domicile_state,
        "discipline_name": employee.discipline.name if employee.discipline else None
    }

@router.get("/dependents", response_model=list[DependentResponse])
def get_my_dependents(db: Session = Depends(get_session), current_user_id: int = Depends(get_user_id)):
    dependents = db.query(Dependent).filter(Dependent.employee_id == current_user_id).all()
    return dependents

@router.get("/tenures", response_model = list[TenureResponse])
def get_my_tenures(db: Session = Depends(get_session), current_user_id: int = Depends(get_user_id)):
    tenures = db.query(TenureRecord, EmployeeTenureCompletionView).join(
        EmployeeTenureCompletionView, TenureRecord.id == EmployeeTenureCompletionView.tenure_id
    ).options(
        joinedload(TenureRecord.position).joinedload(Positions.department),
        joinedload(TenureRecord.assignments)
    ).filter(TenureRecord.employee_id == current_user_id).order_by(TenureRecord.start_date.desc()).all()

    response_data = []
    for t_record, t_view in tenures:
        req_years = t_record.position.location.required_tenure_years
        working_days_per_year = t_record.position.location.required_working_days_per_year
        
        total_working_days_required = req_years * working_days_per_year
        
        calendar_days_served = t_view.time_served.days if t_view.time_served else 0
        
        working_days_served = int(calendar_days_served * (working_days_per_year / 365.25))
        
        remaining_working_days = total_working_days_required - working_days_served
        
        response_data.append({
            "id": t_record.id,
            "start_date": t_record.start_date,
            "end_date": t_record.end_date,
            "department_name": t_record.position.department.name,
            "location": t_view.city, 
            "is_tenure_complete": t_view.is_tenure_complete,
            "time_served_days": working_days_served, # Now showing working days!
            "remaining_days": remaining_working_days if remaining_working_days > 0 else 0,
            "assignments": t_record.assignments
        })
        
        return response_data
    

