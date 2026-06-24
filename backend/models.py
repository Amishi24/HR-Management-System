from __future__ import annotations
import enum
from typing import List, Optional
from datetime import date, datetime
from sqlalchemy import CheckConstraint, String, Integer, SmallInteger, Boolean, Date, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship, DeclarativeBase

class Base(DeclarativeBase):
    pass


class transfer_status(enum.Enum):
    PROPOSED = "Proposed"
    APPROVED = "Approved"
    SUCCESSOR_ASSIGNED = "Successor Assigned"
    HANDOVER_IN_PROGRESS = "Handover In Progress"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"

class policy_scope(enum.Enum):
    GLOBAL = "Global"
    DEPARTMENT = "Department"
    SECTION = "Section"

class dependent_relation(enum.Enum):
    Spouse = "Spouse"
    Child = "Child"


class Location(Base):
    __tablename__ = "location"

    id: Mapped[int] = mapped_column(SmallInteger, primary_key=True, index=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    region: Mapped[str] = mapped_column(String(100), nullable=False)
    is_difficult: Mapped[bool] = mapped_column(Boolean, default=False)
    required_tenure_months: Mapped[int] = mapped_column(Integer, nullable=False, default=24)

    positions: Mapped[List["Positions"]] = relationship(back_populates="location")
    transfer_requests: Mapped[List["TransferRequest"]] = relationship(back_populates="location_preference")

class Department(Base):
    __tablename__ = "department"

    id: Mapped[int] = mapped_column(SmallInteger, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    goal_description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships (Cascade deletes sections and capacities if department is deleted)
    sections: Mapped[List["Section"]] = relationship(back_populates="department", cascade="all, delete-orphan")
    capacities: Mapped[List["DepartmentDisciplineCapacity"]] = relationship(back_populates="department", cascade="all, delete-orphan")

class Discipline(Base):
    __tablename__ = "discipline"

    id: Mapped[int] = mapped_column(SmallInteger, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)

    employees: Mapped[List["Employee"]] = relationship(back_populates="discipline")
    positions: Mapped[List["Positions"]] = relationship(back_populates="discipline")
    capacities: Mapped[List["DepartmentDisciplineCapacity"]] = relationship(back_populates="discipline", cascade="all, delete-orphan")

class RotationPolicy(Base):
    __tablename__ = "rotationpolicy"

    id: Mapped[int] = mapped_column(SmallInteger, primary_key=True, index=True)
    scope_type: Mapped[policy_scope] = mapped_column(String(50), nullable=False)
    scope_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    rules_config: Mapped[dict] = mapped_column(JSONB, nullable=False, default=lambda: {})

class Section(Base):
    __tablename__ = "section"

    id: Mapped[int] = mapped_column(SmallInteger, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    department_id: Mapped[int] = mapped_column(SmallInteger, ForeignKey("department.id", ondelete="CASCADE"))

    department: Mapped["Department"] = relationship(back_populates="sections")
    positions: Mapped[List["Positions"]] = relationship(back_populates="section", cascade="all, delete-orphan")

class DepartmentDisciplineCapacity(Base):
    __tablename__ = "departmentdisciplinecapacity"

    discipline_id: Mapped[int] = mapped_column(SmallInteger, ForeignKey("discipline.id", ondelete="CASCADE"), primary_key=True)
    department_id: Mapped[int] = mapped_column(SmallInteger, ForeignKey("department.id", ondelete="CASCADE"), primary_key=True)
    max_strength: Mapped[int] = mapped_column(Integer)


    discipline: Mapped["Discipline"] = relationship(back_populates="capacities")
    department: Mapped["Department"] = relationship(back_populates="capacities")

class Positions(Base):
    __tablename__ = "positions"
    __table_args__ = (CheckConstraint("level > 0", name="positions_level_check"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    level: Mapped[int] = mapped_column(Integer, nullable=False)
    section_id: Mapped[int] = mapped_column(SmallInteger, ForeignKey("section.id", ondelete="CASCADE"))
    discipline_id: Mapped[int] = mapped_column(SmallInteger, ForeignKey("discipline.id"))
    location_id: Mapped[int] = mapped_column(SmallInteger, ForeignKey("location.id"))
    is_vacant: Mapped[bool] = mapped_column(Boolean, default=True)


    section: Mapped["Section"] = relationship(back_populates="positions")
    discipline: Mapped["Discipline"] = relationship(back_populates="positions")
    location: Mapped["Location"] = relationship(back_populates="positions")
    
    employees: Mapped[List["Employee"]] = relationship(back_populates="current_position")
    tenure_records: Mapped[List["TenureRecord"]] = relationship(back_populates="position", cascade="all, delete-orphan")
    transfer_requests: Mapped[List["TransferRequest"]] = relationship(back_populates="to_position")

class Employee(Base):
    __tablename__ = "employee"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    DoB: Mapped[date] = mapped_column(Date)
    domicile_state: Mapped[str] = mapped_column(String(100), nullable=True)
    DoRetirement: Mapped[date] = mapped_column(Date)

    discipline_id: Mapped[int] = mapped_column(Integer, ForeignKey("discipline.id"))
    current_position_id: Mapped[int] = mapped_column(Integer, ForeignKey("positions.id", ondelete="SET NULL"), nullable=True)


    discipline: Mapped["Discipline"] = relationship(back_populates="employees")
    current_position: Mapped[Optional["Positions"]] = relationship(back_populates="employees")
    
    dependents: Mapped[List["Dependent"]] = relationship(back_populates="employee", cascade="all, delete-orphan")
    medical_records: Mapped[List["Medical"]] = relationship(back_populates="employee", cascade="all, delete-orphan")
    tenure_records: Mapped[List["TenureRecord"]] = relationship(back_populates="employee", cascade="all, delete-orphan")

    transfer_requests: Mapped[List["TransferRequest"]] = relationship(foreign_keys="[TransferRequest.employee_id]", back_populates="employee", cascade="all, delete-orphan")
    approved_transfers: Mapped[List["TransferRequest"]] = relationship(foreign_keys="[TransferRequest.approved_by]", back_populates="approver")

class TenureRecord(Base):
    __tablename__ = "tenurerecord"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employee.id", ondelete="CASCADE"))
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    position_id: Mapped[int] = mapped_column(Integer, ForeignKey("positions.id", ondelete="CASCADE"))

    employee: Mapped["Employee"] = relationship(back_populates="tenure_records")
    position: Mapped["Positions"] = relationship(back_populates="tenure_records")
    assignments: Mapped[List["Assignment"]] = relationship(back_populates="tenure_record", cascade="all, delete-orphan")

class Assignment(Base):
    __tablename__ = "assignment"
    __table_args__ = (CheckConstraint("weightage >= 1 AND weightage <= 10", name="assignment_weightage_check"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    tenurerecord_id: Mapped[int] = mapped_column(ForeignKey("tenurerecord.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(nullable=False)
    weightage: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    skills: Mapped[List[str]] = mapped_column(ARRAY(Text), nullable=False, default=list, server_default="'{}'::text[]")

    tenure_record: Mapped["TenureRecord"] = relationship(back_populates="assignments")

class TransferRequest(Base):
    __tablename__ = "transferrequest"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employee.id", ondelete="CASCADE"))
    status: Mapped[Optional[transfer_status]] = mapped_column(String, default=transfer_status.PROPOSED)
    approved_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("employee.id", ondelete="SET NULL"), nullable=True)
    audit_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=False), default=func.now(), server_default=func.now())    
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=False), default=func.now(), server_default=func.now(), onupdate=func.now())
    location_preference_id: Mapped[Optional[int]] = mapped_column(SmallInteger, ForeignKey("location.id", ondelete="SET NULL"), nullable=True)
    to_position_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("positions.id", ondelete="SET NULL"), nullable=True)

    employee: Mapped["Employee"] = relationship(foreign_keys=[employee_id], back_populates="transfer_requests")
    approver: Mapped[Optional["Employee"]] = relationship(foreign_keys=[approved_by], back_populates="approved_transfers")
    location_preference: Mapped[Optional["Location"]] = relationship(back_populates="transfer_requests")
    to_position: Mapped[Optional["Positions"]] = relationship(back_populates="transfer_requests")

class Dependent(Base):
    __tablename__ = "dependent"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employee.id", ondelete="CASCADE"))
    full_name: Mapped[str] = mapped_column(String)
    relationship: Mapped[dependent_relation] = mapped_column(String)


    employee: Mapped["Employee"] = relationship(back_populates="dependents")
    # uselist=False ensures 1-to-1 relationship mapping
    education: Mapped[Optional["Education"]] = relationship(back_populates="dependent", uselist=False, cascade="all, delete-orphan")

class Education(Base):
    __tablename__ = "education"

    id: Mapped[int] = mapped_column(Integer, ForeignKey("dependent.id", ondelete="CASCADE"), primary_key=True)
    curr_class: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    academic_year: Mapped[Optional[str]] = mapped_column(String, nullable=True)


    dependent: Mapped["Dependent"] = relationship(back_populates="education")

class Medical(Base):
    __tablename__ = "medical"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employee.id", ondelete="CASCADE"))
    issue: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_approve: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)
    issue_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

   
    employee: Mapped["Employee"] = relationship(back_populates="medical_records")


class DependentDetailsView(Base):
    __tablename__ = "vw_dependent_details"

    dependent_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    dependent_name: Mapped[str] = mapped_column(String)
    relationship: Mapped[str] = mapped_column(String)
    employee_id: Mapped[int] = mapped_column(Integer)
    employee_name: Mapped[str] = mapped_column(String)

class EmployeeLocationStatus(Base):
    __tablename__ = "employee_location_status"

    employee_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_name: Mapped[str] = mapped_column(String)
    domicile_state: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    location_city: Mapped[str] = mapped_column(String)
    location_state: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    location_base_difficulty: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    
    is_location_difficult: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)