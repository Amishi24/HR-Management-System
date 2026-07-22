"""
Transfer Head Router
====================
Endpoints for the Transfer Head role to generate, inspect, and execute
optimal transfer cycles, plus view a global overview of pending requests.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select
from pydantic import BaseModel

from database import get_session
from models import (
    TransferRequest, Employee, Positions, Location, transfer_status,
)
from services.cycle_engine_service import CycleEngineService


router = APIRouter()


# ── Request / Response Schemas ───────────────────────────────────────────

class CycleGenerateRequest(BaseModel):
    exempt_employee_ids: List[int] = []
    max_cycle_length: int = 5
    seed_employee_id: int | None = None


class CycleExecuteRequest(BaseModel):
    steps: List[dict]


# ── Endpoints ────────────────────────────────────────────────────────────

@router.get("/approved-employees")
def get_approved_employees(db: Session = Depends(get_session)):
    """List all employees with an APPROVED transfer request for the selector UI."""
    return CycleEngineService.get_approved_employees(db)


@router.post("/cycle/generate")
def generate_cycle(
    req: CycleGenerateRequest,
    db: Session = Depends(get_session),
):
    """Generate the single best transfer cycle, honouring exemptions."""
    result = CycleEngineService.get_optimal_transfer_cycle(
        db,
        exempt_employee_ids=req.exempt_employee_ids,
        max_cycle_length=req.max_cycle_length,
        seed_employee_id=req.seed_employee_id,
    )
    if result is None:
        raise HTTPException(
            status_code=404,
            detail="No valid transfer cycle found with the given constraints.",
        )
    return result


@router.post("/cycle/execute")
def execute_cycle(
    req: CycleExecuteRequest,
    db: Session = Depends(get_session),
):
    """Atomically execute a reviewed transfer cycle."""
    try:
        return CycleEngineService.execute_transfer_cycle(db, req.steps)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Cycle execution failed: {str(exc)}",
        )


@router.get("/requests/overview")
def requests_overview(db: Session = Depends(get_session)):
    """
    Return all pending (non-COMPLETED, non-CANCELLED) transfer requests
    together with summary metrics.
    """
    active_statuses = [
        transfer_status.PROPOSED.name,
        transfer_status.APPROVED.name,
        transfer_status.APPEALED.name,
        transfer_status.SUCCESSOR_ASSIGNED.name,
        transfer_status.HANDOVER_IN_PROGRESS.name,
    ]

    stmt = (
        select(TransferRequest)
        .options(
            joinedload(TransferRequest.employee)
            .joinedload(Employee.current_position)
            .joinedload(Positions.location),
        )
        .where(TransferRequest.status.in_(active_statuses))
        .order_by(TransferRequest.created_at.desc())
    )
    requests = db.execute(stmt).scalars().unique().all()

    # Pre-fetch all locations for preference resolution
    all_locations = {
        loc.id: loc.city
        for loc in db.execute(select(Location)).scalars().all()
    }

    proposed = 0
    approved = 0
    appealed = 0
    items = []

    for req in requests:
        if req.status == transfer_status.PROPOSED.name:
            proposed += 1
        elif req.status == transfer_status.APPROVED.name:
            approved += 1
        elif req.status == transfer_status.APPEALED.name:
            appealed += 1

        emp = req.employee
        current_city = "Unknown"
        if emp and emp.current_position and emp.current_position.location:
            current_city = emp.current_position.location.city

        pref_ids = req.location_preferences or []
        pref_cities = [all_locations.get(lid, f"ID:{lid}") for lid in pref_ids]

        items.append({
            "request_id": req.id,
            "employee_id": emp.id if emp else None,
            "employee_name": emp.name if emp else "Unknown",
            "status": req.status,
            "current_location": current_city,
            "location_preferences": pref_ids,
            "preferred_cities": pref_cities,
            "created_at": req.created_at.isoformat() if req.created_at else None,
        })

    return {
        "summary": {
            "total": len(items),
            "proposed": proposed,
            "approved": approved,
            "appealed": appealed,
        },
        "requests": items,
    }
