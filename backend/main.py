from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

# Import our setup from the files we just created
from database import get_session
from routers import employee, login, Department_head, Location_head, policy

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
app.include_router(login.router, prefix="/auth", tags=["Authentication"])
app.include_router(Department_head.router, prefix="/dept-head", tags=["Department Head"])
app.include_router(Location_head.router, prefix="/loc-head", tags=["Location Head"])
app.include_router(policy.router, prefix="/api", tags=["Policy"])

@app.get("/")
def health_check():
    return {"status": "System Online", "database": "Connected"}



