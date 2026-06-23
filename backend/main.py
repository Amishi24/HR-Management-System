from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

# Import our setup from the files we just created
from database import get_session
from models import Location, Employee
from schemas import LocationResponse, EmployeeResponse

# Initialize the FastAPI application
app = FastAPI(title="ONGC HR Management System")

@app.get("/locations", response_model=list[LocationResponse])
def read_locations(session: Session = Depends(get_session)):
    query = select(Location)
    locations = session.scalars(query).all()
    return locations

@app.get("/employees/{employee_id}", response_model=EmployeeResponse)
def get_employee(employee_id: int, session: Session = Depends(get_session)):
    query = select(Employee).where(Employee.id == employee_id)
    employee = session.scalars(query).first()
    if not employee:
        raise HTTPException(status_code=404, detail=f"Employee with id {employee_id} not found")
    return employee