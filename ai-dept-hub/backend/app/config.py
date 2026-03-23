"""
Application configuration loaded from environment variables.
"""
from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    # MongoDB
    MONGO_URL: str = "mongodb+srv://database2:database2@cluster0.p4ztr4z.mongodb.net/?appName=Cluster0"
    DB_NAME: str = "ai_dept_hub"

    # JWT
    SECRET_KEY: str = "super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # AI
    GEMINI_API_KEY: str = "AIzaSyA3NxsxdGBXwoXGCrc3Ayprtt4QZcOKBbg"

    # Storage
    UPLOAD_DIR: str = "uploads"
    CHROMA_DIR: str = "vector_store"

    # Computed paths
    @property
    def upload_path(self) -> Path:
        p = Path(self.UPLOAD_DIR)
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def chroma_path(self) -> Path:
        p = Path(self.CHROMA_DIR)
        p.mkdir(parents=True, exist_ok=True)
        return p

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
