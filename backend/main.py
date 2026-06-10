from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from database import get_db

app = FastAPI(title="ONGC API Server")

# Allow your React frontend laptop to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Change to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "ONGC FastAPI Backend Server is Running!"}

@app.get("/test-db")
def test_db(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT NOW()")).fetchone()

        return {
            "message": "Database connected successfully!",
            "time": str(result[0])
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database connection failed: {str(e)}"
        )
    
    