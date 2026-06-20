import sys
import os
import asyncio

# Add the project root to the python path so we can import 'app'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.database import engine
from sqlalchemy import text

async def flush_database():
    print("Initiating Database Flush...")
    async with engine.begin() as conn:
        print("Truncating tables: rules, documents, device_components, devices...")
        # Since we use SQLite, we can use DELETE FROM to clear the tables
        await conn.execute(text("DELETE FROM rules"))
        await conn.execute(text("DELETE FROM documents"))
        await conn.execute(text("DELETE FROM device_components"))
        await conn.execute(text("DELETE FROM devices"))
        
        print("Resetting auto-increment counters...")
        # Reset sqlite_sequence to start IDs from 1 again
        try:
            await conn.execute(text("DELETE FROM sqlite_sequence WHERE name IN ('rules', 'documents', 'device_components', 'devices')"))
        except Exception:
            pass # sqlite_sequence might not exist if tables were empty initially
        
    print("Database flush complete! All mock data has been wiped.")
    print("Restart your FastAPI server to trigger a clean ingestion of the seed documents.")

if __name__ == "__main__":
    asyncio.run(flush_database())
