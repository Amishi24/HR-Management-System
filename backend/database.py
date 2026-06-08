import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def get_db_connection():
    # Establishes a raw connection to your Supabase/PostgreSQL DB
    conn = psycopg2.connect(DATABASE_URL)
    return conn