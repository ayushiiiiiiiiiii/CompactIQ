import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Dynamic Compatibility Engine"
    API_V1_STR: str = "/api/v1"
    
    # Database
    USE_SQLITE: bool = os.getenv("USE_SQLITE", "true").lower() == "true"
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "compliance_engine")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        if self.USE_SQLITE:
            return "sqlite+aiosqlite:///./compliance.db"
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    # Redis / Celery
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

    # Paths
    # Documents are automatically loaded from the compatibility_docs seed directory. 
    # Additional compatibility documents can be added without changing application code.
    SEED_DIR: str = os.getenv("SEED_DIR", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../backend/seeds/compatibility_docs")))

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
