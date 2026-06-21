from fastapi import APIRouter, File, UploadFile, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import text
from app.schemas.schemas import DocumentUploadResponse, AdminActionRequest
from app.db.database import get_db
from app.models.models import Document, Rule
import aiofiles
import os
from app.core.config import settings

router = APIRouter()

@router.post("/ingest", response_model=DocumentUploadResponse)
async def upload_document(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    # Save the file to the SEED_DIR directly.
    # Documents are automatically loaded from the compatibility_docs seed directory. 
    # Additional compatibility documents can be added without changing application code.
    seed_dir = settings.SEED_DIR
    if not os.path.exists(seed_dir):
        os.makedirs(seed_dir)

    file_location = os.path.join(seed_dir, file.filename)
    async with aiofiles.open(file_location, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)

    # Trigger the real document ingestion and rule extraction
    from app.services.document_ingestion import ingest_document_file
    doc_id, _ = await ingest_document_file(file_location, file.filename)

    return DocumentUploadResponse(
        task_id=f"doc-ingestion-task-{doc_id if doc_id else 'unknown'}",
        status="completed" if doc_id else "failed"
    )

@router.get("/")
async def list_documents(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document))
    documents = result.scalars().all()
    return {"documents": [{"id": d.id, "filename": d.filename, "status": d.status, "ingested_at": d.ingested_at} for d in documents]}

@router.post("/{document_id}/remove")
async def remove_document(document_id: int, payload: AdminActionRequest, db: AsyncSession = Depends(get_db)):
    if payload.password != settings.ADMIN_MAINTENANCE_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid administrator password.")
        
    # Get the document
    result = await db.execute(select(Document).where(Document.id == document_id))
    document = result.scalars().first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")
        
    filename = document.filename
    
    # Delete associated rules
    await db.execute(text("DELETE FROM rules WHERE document_id = :doc_id"), {"doc_id": document_id})
    
    # Delete document record
    await db.execute(text("DELETE FROM documents WHERE id = :doc_id"), {"doc_id": document_id})
    await db.commit()
    
    # Delete physical file
    seed_dir = settings.SEED_DIR
    file_path = os.path.join(seed_dir, filename)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            # Log error but don't fail the request since DB is already cleaned
            print(f"Warning: Failed to delete physical file {file_path}: {e}")
            
    return {"status": "success", "message": f"Document {filename} removed successfully."}
