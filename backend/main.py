from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

# Import our setup from the files we just created
from database import get_session
from models import Location, Employee
from schemas import LocationResponse
from routers import employee

# Initialize the FastAPI application
app = FastAPI(title="ONGC HR Management System")

app.include_router(employee.router, prefix="/me", tags=["employee[self]"])

@app.get("/")
def health_check():
    return {"status": "System Online", "database": "Connected"}

