from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class LogBase(BaseModel):
    """
    Базовая схема лога
    """
    action: str = Field(..., description="Действие")
    entity_type: str = Field(..., description="Тип сущности")
    entity_id: Optional[int] = Field(None, description="ID сущности")
    details: Optional[Dict[str, Any]] = Field(None, description="Дополнительные данные")
    ip_address: Optional[str] = Field(None, description="IP адрес")


class LogCreate(LogBase):
    """
    Схема для создания лога
    """
    user_id: int = Field(..., description="ID пользователя")


class Log(LogBase):
    """
    Схема лога для ответа
    """
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True