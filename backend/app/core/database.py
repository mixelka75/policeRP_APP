from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import Generator

from app.core.config import settings

# Создание движка БД
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Проверка соединения перед использованием
    echo=settings.DEBUG,  # Логирование SQL запросов в режиме отладки
    pool_size=10,  # Базовый размер пула соединений (увеличен с 5)
    max_overflow=20,  # Максимальное количество дополнительных соединений (увеличен с 10)
    pool_recycle=3600,  # Переcоздание соединений каждый час (3600 сек)
    pool_timeout=60  # Увеличиваем таймаут до 60 секунд
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