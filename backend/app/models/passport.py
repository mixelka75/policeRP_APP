from sqlalchemy import Column, String, Integer, Enum
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
    gender = Column(Enum(Gender), nullable=False)
    
    # Связи
    fines = relationship("Fine", back_populates="passport", cascade="all, delete-orphan")