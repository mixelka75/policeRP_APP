from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import Optional
import os


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://rp_user:rp_password@database:5432/rp_server_db"

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

    # Конфигурация модели - игнорируем лишние переменные окружения
    model_config = ConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra='ignore'  # Игнорируем переменные, которые не определены в модели
    )


# Глобальный экземпляр настроек
settings = Settings()