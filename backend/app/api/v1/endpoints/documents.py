from fastapi import APIRouter, File, UploadFile, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.schemas import DocumentUploadResponse
from app.db.database import get_db
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
    doc_id = await ingest_document_file(file_location, file.filename)

    return DocumentUploadResponse(
        task_id=f"doc-ingestion-task-{doc_id if doc_id else 'unknown'}",
        status="completed" if doc_id else "failed"
    )

@router.get("/")
async def list_documents():
    seed_dir = settings.SEED_DIR
    if not os.path.exists(seed_dir):
        return {"documents": []}
    return {"documents": os.listdir(seed_dir)}
