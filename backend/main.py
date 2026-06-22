from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.responses import HTMLResponse
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

@app.get("/", response_class=HTMLResponse)
@app.get("/home", response_class=HTMLResponse)
def read_root():
    return f"<h1>Welcome to the ONGC API Server</h1><p>Use the /test-db endpoint to check database connectivity.</p>"

@app.get("/test-db")
def test_db(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT NOW()")).fetchone()

        return {
            "message": "Database connection successful!",
            "current_time": str(result[0])
        }

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    
    