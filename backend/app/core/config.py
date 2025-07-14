from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import Optional, List
import os


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://rp_user:rp_password@database:5432/rp_server_db"

    # Discord OAuth2
    DISCORD_CLIENT_ID: str = ""
    DISCORD_CLIENT_SECRET: str = ""
    DISCORD_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/discord/callback"
    DISCORD_GUILD_ID: str = ""  # ID вашего Discord сервера
    DISCORD_POLICE_ROLE_NAME: str = "Полицейский"
    DISCORD_ADMIN_ROLE_NAME: str = "Администратор сайта"

    # SP-Worlds API
    SPWORLDS_MAP_ID: str = ""
    SPWORLDS_MAP_TOKEN: str = ""
    SPWORLDS_API_URL: str = "https://api.spworlds.ru"

    # Security
    SECRET_KEY: str = "your-super-secret-key-here-please-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 часа

    # Role check interval (in minutes)
    ROLE_CHECK_INTERVAL: int = 30  # Проверка ролей каждые 30 минут

    # App
    PROJECT_NAME: str = "RP Server Backend"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    FRONTEND_URL: str = "http://localhost:3000"

    # Redis (для кеширования и фоновых задач)
    REDIS_URL: str = "redis://localhost:6379/0"

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Конфигурация модели - игнорируем лишние переменные окружения
    model_config = ConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra='ignore'  # Игнорируем переменные, которые не определены в модели
    )


# Глобальный экземпляр настроек
settings = Settings()