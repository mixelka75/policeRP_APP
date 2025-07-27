from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
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
    updated_at: datetime
    
    class Config:
        from_attributes = True


class LogPagination(BaseModel):
    """
    Схема для пагинации логов
    """
    page: int = Field(..., description="Номер страницы")
    page_size: int = Field(..., description="Размер страницы")
    total_count: int = Field(..., description="Общее количество записей")
    total_pages: int = Field(..., description="Общее количество страниц")
    has_next: bool = Field(..., description="Есть ли следующая страница")
    has_prev: bool = Field(..., description="Есть ли предыдущая страница")


class LogResponse(BaseModel):
    """
    Схема ответа с логами и пагинацией
    """
    logs: List[Log] = Field(..., description="Список логов")
    pagination: LogPagination = Field(..., description="Информация о пагинации")