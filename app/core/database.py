from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import Generator

from app.core.config import settings

# Создание движка БД
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Проверка соединения перед использованием
    echo=settings.DEBUG  # Логирование SQL запросов в режиме отладки
)

# Создание фабрики сессий
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Базовый класс для моделей
Base = declarative_base()


def get_db() -> Generator:
    """
    Генератор сессии базы данных для использования в зависимостях FastAPI
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()