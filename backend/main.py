from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

# Import our setup from the files we just created
from database import get_session
from models import Location, Employee
from schemas import LocationResponse
from routers import employee, Department_head

# Initialize the FastAPI application
app = FastAPI(title="ONGC HR Management System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(employee.router, prefix="/me", tags=["employee[self]"])
app.include_router(Department_head.router, prefix="/dept-head", tags=["Department Head Operations"])

@app.get("/")
def health_check():
    return {"status": "System Online", "database": "Connected"}

