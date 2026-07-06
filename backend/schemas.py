from datetime import date, datetime
from pickle import GLOBAL
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from models import policy_scope


# LOGIN 
class LoginRequest(BaseModel):
    employee_id: int
    # password: str | None = None

class LoginResponse(BaseModel):
    employee_id: int
    employee_name: str
    role: str


# employeeMe
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

# Department_head

class LightTeamEmployeeResponse(BaseModel):
    employee_id: int
    employee_name: str
    discipline: str
    Assigned_department: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class DetailedEmployeeResponse(EmployeeMeResponse):
    tenures: List[TenureDetailResponse] = []

    active_transfers : List[TransferResponse] = []

    dependents: List[DependentResponse] = []

    model_config = ConfigDict(from_attributes=True)


class TransferAlertResponse(BaseModel):
    employee_id: int
    employee_name: str
    current_state: str
    current_city: str
    department_name: str
    tenure_start_date: date
    years_served: float 
    alert_type: str

    model_config = ConfigDict(from_attributes=True)

class TransferInitiatePayload(BaseModel):
    employee_id: int
    # We will expand this later based on your final input requirements
    reason: Optional[str] = "Initiated by your head."

class SubDepartmentResponse(BaseModel):
    id: int
    name: str
    parent_dept: Optional[str] = None   
    depth: int
    model_config = ConfigDict(from_attributes=True)

class DepartmentTransferResponse(TransferResponse):
    employee_id: int
    employee_name: str
    current_department: str
    model_config = ConfigDict(from_attributes=True)


class TransferReviewPayload(BaseModel):
    status: str = Field(
        ..., 
        pattern="^(APPROVED|CANCELLED|REJECTED)$", 
        description="Must be a valid review state."
    )
    review_notes: str

class TransferAppealPayload(BaseModel):
    appeal_type: str = Field(..., pattern="^(MEDICAL|EDUCATION)$")
    appeal_notes: str

class ExemptionContextResponse(BaseModel):
    medical_issues: list[str] = []
    board_exam_children: list[str] = []

class AppealDecisionPayload(BaseModel):
    decision: str = Field(..., pattern="^(ACCEPT_APPEAL|REJECT_APPEAL)$")
    manager_notes: str

class CapacityDashboardResponse(BaseModel):
    department_name: str
    discipline_name: str
    level: int
    max_strength: int
    current_active: int
    vacancies: int

class AssignmentCreatePayload(BaseModel):
    title: str
    weightage: int = Field(..., ge=1, le=10, description="Weightage must be between 1 and 10")
    skills: List[str] = []


# Location Head
class LocationDetailsResponse(BaseModel):
    id: int
    city: str
    state: Optional[str] = None
    region: Optional[str] = None
    is_difficult: bool
    required_tenure_years: int
    required_working_days_per_year: int

    model_config = ConfigDict(from_attributes=True)

class UpdateLocationRequirementsRequest(BaseModel):
    required_tenure_years: Optional[int] = Field(None, ge=0)
    required_working_days_per_year: Optional[int] = Field(None, ge=0, le=365)

    model_config = ConfigDict(from_attributes=True)

class PositionDetailsResponse(BaseModel):
    id: int
    department_name: str
    discipline_name: Optional[str] = None
    level: int
    is_vacant: bool 

    model_config = ConfigDict(from_attributes=True)

class PositionCreateRequest(BaseModel):
    level: int = Field(..., ge=1, le=8)
    department_id: int
    discipline_id: Optional[int] = None
    is_vacant: bool = True

class PositionUpdateRequest(BaseModel):
    level: Optional[int] = Field(None, ge=1, le=8)
    department_id: Optional[int] = None
    discipline_id: Optional[int] = None
    is_vacant: Optional[bool] = None


class DepartmentLookupResponse(BaseModel):
    id: int
    name: str
    parent_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

class DisciplineLookupResponse(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class LevelGatingRules(BaseModel):
    lateral_only: List[int] = Field(default_factory=list)
    promotions_allowed: List[int] = Field(default_factory=list)

class TenureRules(BaseModel):
    min_tenure_years: int = Field(..., ge=1)
    max_tenure_years: int = Field(..., ge=1)

class RulesConfigPayload(BaseModel):
    level_gating: Optional[LevelGatingRules] = None
    tenure_rules: Optional[TenureRules] = None

class RotationPolicyResponse(BaseModel):
    id: int
    scope_type: str
    scope_id: Optional[int] = None
    rules_config: Dict

    model_config = ConfigDict(from_attributes=True)

class RotationPolicyCreateUpdate(BaseModel):
    scope_type: Optional[policy_scope] = GLOBAL
    scope_id: Optional[int] = None
    rules_config: Optional[RulesConfigPayload] = None

    @model_validator(mode='before')
    @classmethod
    def normalize_casing(cls, data: Any) -> Any:
        if isinstance(data, dict) and 'scope_type' in data and isinstance(data['scope_type'], str):
            data['scope_type'] = data['scope_type'].capitalize()
        return data

    @model_validator(mode='after')
    def check_scope_id(self):
        if self.scope_type == policy_scope.LOCAL and self.scope_id is None:
            raise ValueError("scope_id is required for Local scope_type")
        return self
    