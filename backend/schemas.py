from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field

class DependentResponse(BaseModel):
    id: int
    full_name: str
    relation: str

    model_config = ConfigDict(from_attributes=True)

class AssignmentResponse(BaseModel):
    title: str
    weightage: int
    skills : list[str] = []
    model_config = ConfigDict(from_attributes=True)

class TenureResponse(BaseModel):
    id: int
    start_date: date
    end_date: Optional[date] = None
    department_name: str
    location: str
    is_tenure_complete: bool
    model_config = ConfigDict(from_attributes=True)

class TenureDetailResponse(TenureResponse):
    level : int
    time_served_days : int
    remaining_days : int
    assignments : List[AssignmentResponse] = []

    model_config = ConfigDict(from_attributes=True)


class EmployeeBase(BaseModel):
    id: int
    name: str
    email: EmailStr
    DoB: date
    DoRetirement: date
    domicile_state: str

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


class DependentCreate(BaseModel):
    full_name: str
    relation: str

    curr_class: Optional[int] = None
    academic_year: Optional[str] = None

class DependentUpdate(BaseModel):
    full_name: Optional[str] = None
    relation: Optional[str] = None

class EducationBase(BaseModel):
    curr_class: Optional[int] = None
    academic_year: Optional[str] = None

class ChildrenResponse(EducationBase):
    dependent_id: int
    name: str
    model_config = ConfigDict(from_attributes=True)


class EducationCreate(EducationBase):
    pass

class EducationUpdate(EducationBase):
    pass


class MedicalCreate(BaseModel):
    issue: str
    issue_year: int

class MedicalUpdate(BaseModel):
    issue: Optional[str] = None
    issue_year: Optional[int] = None

class MedicalResponse(BaseModel):
    id: int
    issue: str
    issue_year: int
    is_approve: Optional[bool] = False

    model_config = ConfigDict(from_attributes=True)


class TransferCreate(BaseModel):
    location_preferences: List[int] = Field(..., min_length=1, max_length=3)

class TransferResponse(BaseModel):
    id: int
    status: str
    audit_notes: Optional[str] = None
    location_preferences: List[int]
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class LocationResponse(BaseModel):
    id : int
    city : str
    state: str

    model_config = ConfigDict(from_attributes=True)

