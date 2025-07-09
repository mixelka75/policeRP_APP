from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/rp_server_db"
    
    # Security
    SECRET_KEY: str = "your-super-secret-key-here-please-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # App
    PROJECT_NAME: str = "RP Server Backend"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Admin user
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin123"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Глобальный экземпляр настроек
settings = Settings()