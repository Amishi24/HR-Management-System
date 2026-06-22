from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pyparsing import Optional

class LocationBase(BaseModel):
    id: int
    city: str
    state: str
    region: str
    is_difficult: bool = False
    required_tenure_months: int | None = Field(default=None)

    model_config = ConfigDict(from_attributes=True)

class LocationResponse(LocationBase):
    pass

class EmployeeBase(BaseModel): 
    id: int 
    name: str
    DoB: date
    domicile_state: str|None
    DoRetirement: date


class EmployeeResponse(EmployeeBase):
    pass
    
class HR_EmployeeResponse(EmployeeBase):
    model_config = ConfigDict(from_attributes=True)

    discipline_id: int
    current_position_id: int