from sqlalchemy import Column, String, Integer, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Log(BaseModel):
    """
    Модель логов действий пользователей
    """
    __tablename__ = "logs"
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    action = Column(String(100), nullable=False)  # Тип действия (CREATE, UPDATE, DELETE)
    entity_type = Column(String(50), nullable=False)  # Тип сущности (passport, fine, user)
    entity_id = Column(Integer, nullable=True)  # ID сущности
    details = Column(JSON, nullable=True)  # Дополнительные данные в JSON формате
    ip_address = Column(String(45), nullable=True)  # IP адрес пользователя
    
    # Связи
    user = relationship("User", back_populates="logs")