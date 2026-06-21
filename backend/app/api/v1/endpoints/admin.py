from fastapi import APIRouter, Depends, HTTPException
from app.schemas.schemas import AdminActionRequest
from app.core.config import settings

router = APIRouter()

@router.post("/flush")
async def flush_database_endpoint(payload: AdminActionRequest):
    if payload.password != settings.ADMIN_MAINTENANCE_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid administrator password.")
        
    try:
        from scripts.flush_db import flush_database
        await flush_database()
        return {"status": "success", "message": "Database successfully flushed."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to flush database: {str(e)}")
