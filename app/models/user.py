from sqlalchemy import Column, String, Boolean, Enum
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel


class UserRole(enum.Enum):
    """
    Роли пользователей
    """
    ADMIN = "admin"
    POLICE = "police"


class User(BaseModel):
    """
    Модель пользователя системы
    """
    __tablename__ = "users"
    
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.POLICE)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Связи
    created_fines = relationship("Fine", back_populates="created_by", foreign_keys="Fine.created_by_user_id")
    logs = relationship("Log", back_populates="user")