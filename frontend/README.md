# ONGC Frontend

This is the React + Vite frontend for the ONGC project.

## Local setup

1. Open a terminal in `frontend`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open the URL shown in the terminal (usually `http://localhost:5173`)

## Backend setup

The backend server is in the `backend` folder. Install Python dependencies there:

```bash
cd ../backend
pip install -r requirements.txt
```

Then run the FastAPI server:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Notes

- The frontend uses CORS settings that currently allow all origins.
- In production, change `allow_origins` in `backend/main.py` to your frontend URL.
- Make sure the backend `.env` file includes `DATABASE_URL` for your database.
