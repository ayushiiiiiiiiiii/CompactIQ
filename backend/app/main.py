from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    # Create tables if they do not exist
    from app.db.database import engine, Base
    from app.services.document_ingestion import load_and_ingest_seeds

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Automatic loading of seed directory on startup
    await load_and_ingest_seeds()

@app.get("/")
def root():
    return {"message": f"Welcome to the {settings.PROJECT_NAME} API"}

app.include_router(api_router, prefix=settings.API_V1_STR)

