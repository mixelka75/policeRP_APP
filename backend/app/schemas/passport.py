from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.passport import Gender


class PassportBase(BaseModel):
    """
    Базовая схема паспорта
    """
    first_name: str = Field(..., min_length=2, max_length=100, description="Имя")
    last_name: str = Field(..., min_length=2, max_length=100, description="Фамилия")
    nickname: str = Field(..., min_length=3, max_length=50, description="Никнейм")
    age: int = Field(..., ge=16, le=100, description="Возраст")
    gender: Gender = Field(..., description="Пол")


class PassportCreate(PassportBase):
    """
    Схема для создания паспорта
    """
    pass


class PassportUpdate(BaseModel):
    """
    Схема для обновления паспорта
    """
    first_name: Optional[str] = Field(None, min_length=2, max_length=100)
    last_name: Optional[str] = Field(None, min_length=2, max_length=100)
    nickname: Optional[str] = Field(None, min_length=3, max_length=50)
    age: Optional[int] = Field(None, ge=16, le=100)
    gender: Optional[Gender] = None


class Passport(PassportBase):
    """
    Схема паспорта для ответа
    """
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PassportInfo(BaseModel):
    """
    Краткая информация о паспорте для списков
    """
    id: int
    first_name: str
    last_name: str
    nickname: str
    
    class Config:
        from_attributes = True