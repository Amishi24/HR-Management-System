from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field

class DependentResponse(BaseModel):
    full_name: str
    relation: str

    model_config = ConfigDict(from_attributes=True)

class AssignmentResponse(BaseModel):
    title: str
    weightage: int
    model_config = ConfigDict(from_attributes=True)

class TenureResponse(BaseModel):
    id: int
    start_date: date
    end_date: Optional[date] = None

    department_name: str
    location: str
    is_tenure_complete: bool
    time_served_days: int 
    remaining_days: int
    assignments: List[AssignmentResponse] = []

    model_config = ConfigDict(from_attributes=True)

class EmployeeMeResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    DoB: date
    DoRetirement: date
    domicile_state: str
    discipline_name: str
    model_config= ConfigDict(from_attributes=True)


    

    
