# app/models/passport.py
from sqlalchemy import Column, String, Integer, DateTime, Boolean, func
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel


class Gender(enum.Enum):
    """
    Пол жителя
    """
    MALE = "male"
    FEMALE = "female"


class Passport(BaseModel):
    """
    Модель паспорта жителя
    """
    __tablename__ = "passports"

    first_name = Column(String(100), nullable=False, index=True)
    last_name = Column(String(100), nullable=False, index=True)
    nickname = Column(String(50), unique=True, index=True, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(10), nullable=False)

    # НОВЫЕ ПОЛЯ:
    city = Column(String(100), nullable=False, index=True)  # Город проживания
    violations_count = Column(Integer, default=0, nullable=False)  # Количество нарушений
    entry_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)  # Дата входа в город
    is_emergency = Column(Boolean, default=False, nullable=False, index=True)  # ЧС статус

    # Связи
    fines = relationship("Fine", back_populates="passport", cascade="all, delete-orphan")