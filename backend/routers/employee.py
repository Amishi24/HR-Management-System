from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from datetime import date, timedelta
from sqlalchemy.exc import SQLAlchemyError

from database import get_session
from models import Employee, Dependent, TenureRecord, Positions, EmployeeTenureCompletionView, Education, Medical
from schemas import (
    EmployeeMeResponse, 
    DependentResponse, 
    EmployeeBase,
    TenureResponse,
    DependentCreate,
    DependentUpdate,
    ChildrenResponse,
    EducationCreate,
    EducationUpdate,
    MedicalResponse,
    MedicalCreate,
    MedicalUpdate
)

router = APIRouter()

def get_user_id() -> int:
    return 10001628

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

def get_current_employee_record(
    db: Session = Depends(get_session), 
    current_user_id: int = Depends(get_user_id)
) -> Employee:
    
    employee = db.query(Employee).options(
        joinedload(Employee.discipline)
    ).filter(Employee.id == current_user_id).first()

    if not employee: 
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    
    return employee

@router.get("/dependents", response_model=list[DependentResponse])
def get_my_dependents(db: Session = Depends(get_session), current_user_id: int = Depends(get_user_id)):
    dependents = db.query(Dependent).filter(Dependent.employee_id == current_user_id).all()
    return dependents

@router.post("/dependents", status_code=status.HTTP_201_CREATED)
def create_my_dependents(
    payload: DependentCreate,
    db: Session = Depends(get_session),
    employee: Employee = Depends(get_current_employee_record)
):

        new_dependent = Dependent(
            employee_id = employee.id,
            full_name = payload.full_name,
            relation = payload.relation 
        )   
        db.add(new_dependent)
        
        db.flush() 

        if payload.curr_class is not None:
            new_education = Education(
                id = new_dependent.id, # Uses the ID seamlessly fetched by the flush
                curr_class = payload.curr_class,
                academic_year = payload.academic_year
            )
            db.add(new_education)

        # Commit both the dependent and education records together
        db.commit()
        return {"message": "Dependent created successfully", "dependent_id": new_dependent.id}

@router.patch("/dependents/{dependent_id}")
def update_my_dependent(
    dependent_id : int,
    payload: DependentUpdate,
    db: Session = Depends(get_session),
    employee : Employee = Depends(get_current_employee_record)
):

        dependent = db.query(Dependent).filter(
            Dependent.id == dependent_id,
            Dependent.employee_id == employee.id
        ).first()

        if not dependent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dependent not found or you do not have permission to modify this record"
            )
        
        if payload.full_name is not None:
            dependent.full_name = payload.full_name
        if payload.relation is not None:
            dependent.relation = payload.relation

        db.commit()
        return {"message": "Dependent updated successfully"}


@router.delete("/dependents/{dependent_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_dependent(
    dependent_id : int,
    db : Session = Depends(get_session),
    employee : Employee = Depends(get_current_employee_record)
):
    dependent = db.query(Dependent).filter(
        Dependent.id == dependent_id,
        Dependent.employee_id == employee.id
    ).first()

    if not dependent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dependent not found or access denied."
        )

    db.delete(dependent)
    db.commit()
    
    return {"message": "Dependent deleted successfully"}


@router.get("/dependents/{dependent_id}/children", response_model=list[ChildrenResponse])
def get_dependent_education(
    dependent_id: int,
    db : Session = Depends(get_session),
    employee: Employee = Depends(get_current_employee_record)
):
    dependents = db.query(Dependent).filter(
         Dependent.id == dependent_id,
         Dependent.employee_id == employee.id
         ).all()
    children = []
    for dependent in dependents:
        if dependent.relation == "Child":
            child_class = dependent.education.curr_class if dependent.education else None
            child_academic_year = dependent.education.academic_year if dependent.education else None
            children.append(
                {
                    "dependent_id" : dependent.id,
                    "name" : dependent.full_name,
                    "curr_class" : child_class,
                    "academic_year" : child_academic_year
                }
            )

    return children

@router.post("/dependents/{dependent_id}/education", status_code = status.HTTP_201_CREATED)
def create_dependent_education(
    payload : EducationCreate,
    dependent_id: int,
    db : Session = Depends(get_session),
    employee : Employee = Depends(get_current_employee_record)
):
    dependent = db.query(Dependent).filter(
        Dependent.employee_id == employee.id,
        Dependent.id == dependent_id,
        Dependent.relation =="Child"
    ).first()

    if not dependent :
        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND,
            detail = "Dependent not found or access denied"
        )
    
    existing_edu = db.query(Education).filter(Education.id == dependent_id).first()
    if existing_edu:
        raise HTTPException(status_code=400, detail="Education record already exists. Use PATCH to update.")
    
    new_education = Education(
        id = dependent_id,
        curr_class = payload.curr_class,
        academic_year = payload.academic_year
    )
    db.add(new_education)
    db.commit()

    return {"message" : "Education record created successfully"}

    
@router.patch("/dependents/{dependent_id}/education")
def update_dependent_education(
    payload : EducationUpdate,
    dependent_id : int,
    db : Session = Depends(get_session),
    employee : Employee = Depends(get_current_employee_record)

):
    dependent = db.query(Dependent).filter(
        Dependent.id == dependent_id,
        Dependent.employee_id == employee.id,
        Dependent.relation == "Child"
    ).first()

    if not dependent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dependent not found or access denied"
        )
    
    education_record = db.query(Education).filter(Education.id == dependent_id).first()
    if not education_record:
        raise HTTPException(status_code=404, detail="Education record not found.")

    if payload.curr_class is not None:
        education_record.curr_class = payload.curr_class
    if payload.academic_year is not None:
        education_record.academic_year = payload.academic_year

    db.commit()
    return {"message": "Education record updated successfully"}


@router.delete("/dependents/{dependent_id}/education", status_code=status.HTTP_204_NO_CONTENT)
def delete_dependent_education(
    dependent_id: int,
    db: Session = Depends(get_session),
    employee: Employee = Depends(get_current_employee_record)
):
  
    dependent = db.query(Dependent).filter(
        Dependent.id == dependent_id,
        Dependent.employee_id == employee.id,
        Dependent.relation == "Child"
    ).first()

    if not dependent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Dependent not found or access denied."
        )

    education_record = db.query(Education).filter(Education.id == dependent_id).first()
    
    if not education_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Education record not found."
        )

    db.delete(education_record)
    db.commit()
    
    return {"message": "Education record deleted successfully"}





@router.get("/tenures", response_model = list[TenureResponse])
def get_my_tenures(db: Session = Depends(get_session), employee : Employee = Depends(get_current_employee_record), current_user_id: int = Depends(get_user_id)):
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
            "level": t_record.position.level,
            "location": t_view.city, 
            "is_tenure_complete": t_view.is_tenure_complete,
            "time_served_days": working_days_served, # Now showing working days!
            "remaining_days": remaining_working_days if remaining_working_days > 0 else 0,
            "assignments": t_record.assignments
        })
        
    return response_data
    

@router.get("/medical", response_model=list[MedicalResponse])
def get_my_medical_records(
    db : Session = Depends(get_session),
    employee : Employee = Depends(get_current_employee_record)
):
    records = db.query(Medical).filter(Medical.employee_id == employee.id).all()

    return records

@router.post("/medical", status_code=status.HTTP_201_CREATED)
def create_my_medical_records(
    payload : MedicalCreate,
    employee : Employee = Depends(get_current_employee_record),
    db: Session =Depends(get_session)
):
    new_record = Medical(
        employee_id = employee.id,
        issue = payload.issue,
        issue_year = payload.issue_year,
        is_approve = False
    )
    db.add(new_record)
    db.commit()
    return {"message": "Medical record created successfully", "medical_id" : new_record.id}

@router.patch("/medical/{medical_id}")
def update_my_medical_records(
    medical_id : int, 
    payload : MedicalUpdate,
    employee : Employee = Depends(get_current_employee_record),
    db: Session = Depends(get_session)
):
    record = db.query(Medical).filter(
        Medical.id == medical_id,
        Medical.employee_id == employee.id
    ).first()

    if not record: 
        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND,
            detail = "medicalRecord not found or access denied"
        )
    
    if payload.issue is not None:
        record.issue = payload.issue
    if payload.issue_year is not None:
        record.issue_year = payload.issue_year

    db.commit()
    return {"message": "Medical record updated successfully"}
    
@router.delete("/medical/{medical_id}", status_code = status.HTTP_204_NO_CONTENT)
def delete_my_record(
    medical_id : int,
    employee : Employee = Depends(get_current_employee_record), 
    db : Session = Depends(get_session)
):
    record = db.query(Medical).filter(
        Medical.id == medical_id,
        Medical.employee_id == employee.id
    ).first()

    if not record : 
        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND,
            detail = "medicalRecord not found or access denied"
        )
    
    db.delete(record)
    db.commit()
    return {"message": "Medical record deleted successfully"}


