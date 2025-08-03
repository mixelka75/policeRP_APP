from pydantic_settings import BaseSettings
from pydantic import ConfigDict, field_validator
from typing import Optional, List
import os
import json


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://rp_user:rp_password@database:5432/rp_server_db"

    # Discord OAuth2
    DISCORD_CLIENT_ID: str = ""
    DISCORD_CLIENT_SECRET: str = ""
    DISCORD_BOT_TOKEN: str = ""  # Токен бота для получения ролей
    DISCORD_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/discord/callback"
    DISCORD_GUILD_ID: str = ""  # ID вашего Discord сервера

    # Discord Role Names (для отображения)
    DISCORD_POLICE_ROLE_NAME: str = "Полицейский"
    DISCORD_ADMIN_ROLE_NAME: str = "Администратор сайта"

    # Discord Role IDs (более надежно для проверки)
    DISCORD_POLICE_ROLE_ID: str = "1394324971416846359"
    DISCORD_ADMIN_ROLE_ID: str = "1394325091734523994"

    # SP-Worlds API
    SPWORLDS_MAP_ID: str = ""
    SPWORLDS_MAP_TOKEN: str = ""
    SPWORLDS_API_URL: str = "https://spworlds.ru/api/public"

    # Payment Configuration
    PAYMENT_WEBHOOK_URL: str = "https://yourdomain.com/api/v1/payments/webhook"
    PAYMENT_SUCCESS_REDIRECT_URL: str = "http://localhost:3000/fines?payment=success"
    PAYMENT_CANCEL_REDIRECT_URL: str = "http://localhost:3000/fines?payment=cancelled"

    # Security
    SECRET_KEY: str = "your-super-secret-key-here-please-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 525600  # 1 год (365 дней * 24 часа * 60 минут)

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
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000", 
        "http://localhost:5173",
        "http://localhost:8000",  # Add backend URL for development
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000"
    ]
    
    @field_validator('ALLOWED_ORIGINS', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            try:
                # Пытаемся распарсить как JSON
                return json.loads(v)
            except json.JSONDecodeError:
                # Если не JSON, разделяем по запятым
                return [origin.strip() for origin in v.split(',') if origin.strip()]
        return v

    # Конфигурация модели - игнорируем лишние переменные окружения
    model_config = ConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra='ignore'  # Игнорируем переменные, которые не определены в модели
    )


# Глобальный экземпляр настроек
settings = Settings()