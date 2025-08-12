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
    
    # Разрешаем добавление дополнительных атрибутов (например, bt_balance)
    __allow_unmapped__ = True

    first_name = Column(String(100), nullable=False, index=True)
    last_name = Column(String(100), nullable=False, index=True)
    discord_id = Column(String(50), unique=True, index=True, nullable=False)
    nickname = Column(String(50), index=True, nullable=True)
    uuid = Column(String(50), index=True, nullable=True)
    age = Column(Integer, nullable=False)
    gender = Column(String(10), nullable=False)

    # НОВЫЕ ПОЛЯ:
    city = Column(String(100), nullable=False, index=True)  # Город проживания
    violations_count = Column(Integer, default=0, nullable=False)  # Количество нарушений
    entry_date = Column(DateTime(timezone=True), nullable=False)  # Дата въезда в город
    is_emergency = Column(Boolean, default=False, nullable=False, index=True)  # ЧС статус

    # Связи
    fines = relationship("Fine", back_populates="passport", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="passport", cascade="all, delete-orphan")