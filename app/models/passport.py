# app/models/passport.py
from sqlalchemy import Column, String, Integer, DateTime, func
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
    # ИСПРАВЛЕНИЕ: используем строковое значение enum напрямую
    gender = Column(String(10), nullable=False)  # Изменено на String
    # НОВЫЕ ПОЛЯ
    city = Column(String(100), nullable=False, index=True)  # Город проживания
    city_entry_date = Column(DateTime(timezone=True), nullable=False, default=func.now())  # Дата входа в город

    # Связи
    fines = relationship("Fine", back_populates="passport", cascade="all, delete-orphan")