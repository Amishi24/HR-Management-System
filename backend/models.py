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
    city : Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    region: Mapped[str] = mapped_column(String(100), nullable=False)
    is_difficult: Mapped[bool] = mapped_column(Boolean, default=False)
    required_tenure_months: Mapped[int | None] = mapped_column(Integer, nullable=True, default = 24)

class Department(Base):
    __tablename__ = "department"

    id: Mapped[int] = mapped_column(SmallInteger, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    goal_description: Mapped[str | None] = mapped_column(Text, nullable=True)

class Discipline(Base):
    __tablename__ = "discipline"

    id: Mapped[int] = mapped_column(SmallInteger, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)

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
    department_id: Mapped[int] = mapped_column(SmallInteger, ForeignKey("department.id"))

class DepartmentDisciplineCapacity(Base):
    __tablename__ = "departmentdisciplinecapacity"

    discipline_id: Mapped[int] = mapped_column(SmallInteger, ForeignKey("discipline.id"), primary_key=True)
    department_id: Mapped[int] = mapped_column(SmallInteger, ForeignKey("department.id"), primary_key=True)
    max_strength: Mapped[int] = mapped_column(Integer)

class Positions(Base):
    __tablename__ = "positions"
    __table_args__ = (
        CheckConstraint("level > 0", name="positions_level_check"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    level: Mapped[int] = mapped_column(Integer, nullable=False)
    section_id: Mapped[int] = mapped_column(SmallInteger, ForeignKey("section.id"))
    discipline_id: Mapped[int] = mapped_column(SmallInteger, ForeignKey("discipline.id"))
    location_id: Mapped[int] = mapped_column(SmallInteger, ForeignKey("location.id"))
    is_vacant: Mapped[bool] = mapped_column(Boolean, default=True)

class TenureRecord(Base):
    __tablename__ = "tenurerecord"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employee.id"))
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    position_id: Mapped[int] = mapped_column(Integer, ForeignKey("positions.id"))

class TransferRequest(Base):
    __tablename__ = "transferrequest"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employee.id"))
    status: Mapped[Optional[transfer_status]] = mapped_column(String, default=transfer_status.PROPOSED)
    approved_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("employee.id"), nullable=True)
    audit_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[Optional[datetime]] = mapped_column(
            DateTime(timezone=False), 
            default=func.now(), 
            server_default=func.now()
        )    
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=False), 
        default=func.now(), 
        server_default=func.now(),
        onupdate=func.now()
    )
    location_preference_id: Mapped[Optional[int]] = mapped_column(SmallInteger, ForeignKey("location.id"), nullable=True)
    to_position_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("positions.id"), nullable=True)

class Assignment(Base):
    __tablename__ = "assignment"
    __table_args__ = (
        CheckConstraint("weightage >= 1 AND weightage <= 10", name="assignment_weightage_check"),
    )

    # Primary Key
    id: Mapped[int] = mapped_column(primary_key=True)
    
    # Foreign Key (with CASCADE deletion rule)
    tenurerecord_id: Mapped[int] = mapped_column(
        ForeignKey("tenurerecord.id", ondelete="CASCADE"), 
        nullable=False
    )
    
    title: Mapped[str] = mapped_column(nullable=False)
    weightage: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    
    # PostgreSQL text[] Array mapping
    skills: Mapped[List[str]] = mapped_column(
        ARRAY(Text), 
        nullable=False, 
        default=list, 
        server_default="'{}'::text[]"
    )

class Dependent(Base):
    __tablename__ = "dependent"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employee.id"))
    full_name: Mapped[str] = mapped_column(String)
    relationship: Mapped[dependent_relation] = mapped_column(String)

class Education(Base):
    __tablename__ = "education"

    # ID is both the Primary Key AND a Foreign Key to the dependent table
    id: Mapped[int] = mapped_column(Integer, ForeignKey("dependent.id"), primary_key=True)
    curr_class: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    academic_year: Mapped[Optional[str]] = mapped_column(String, nullable=True)

class Medical(Base):
    __tablename__ = "medical"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employee.id"))
    issue: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_approve: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)
    issue_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

class DependentDetailsView(Base):
    __tablename__ = "vw_dependent_details"

    dependent_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    dependent_name: Mapped[str] = mapped_column(String)
    relationship: Mapped[str] = mapped_column(String)
    employee_id: Mapped[int] = mapped_column(Integer)
    employee_name: Mapped[str] = mapped_column(String)

class Employee(Base):
    __tablename__ = "employee"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    DoB: Mapped[date] = mapped_column(Date)
    domicile_state: Mapped[str] = mapped_column(String(100), nullable=True)
    DoRetirement: Mapped[date] = mapped_column(Date)

    discipline_id: Mapped[int] = mapped_column(Integer, ForeignKey("discipline.id"))
    current_position_id: Mapped[int] = mapped_column(Integer, ForeignKey("positions.id"))