# app/models/user.py
from sqlalchemy import Column, String, Boolean, BigInteger, DateTime, func, JSON
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

    # Discord данные
    discord_id = Column(BigInteger, unique=True, index=True, nullable=False)
    discord_username = Column(String(100), nullable=False)
    discord_discriminator = Column(String(10), nullable=True)  # Может быть None для новых пользователей
    discord_avatar = Column(String(255), nullable=True)

    # SP-Worlds данные
    minecraft_username = Column(String(50), nullable=True)
    minecraft_uuid = Column(String(36), nullable=True)

    # Данные о ролях
    role = Column(String(20), nullable=False, default='police')
    is_active = Column(Boolean, default=True, nullable=False)

    # Данные о Discord ролях (для кеширования)
    discord_roles = Column(JSON, nullable=True)  # Список ID ролей

    # Последняя проверка ролей
    last_role_check = Column(DateTime(timezone=True), nullable=True)

    # OAuth данные
    discord_access_token = Column(String(512), nullable=True)
    discord_refresh_token = Column(String(512), nullable=True)
    discord_expires_at = Column(DateTime(timezone=True), nullable=True)

    # Связи
    created_fines = relationship("Fine", back_populates="created_by", foreign_keys="Fine.created_by_user_id")
    logs = relationship("Log", back_populates="user")