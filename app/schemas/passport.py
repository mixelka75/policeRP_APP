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
    city: str = Field(..., min_length=2, max_length=100, description="Город проживания")


class PassportCreate(PassportBase):
    """
    Схема для создания паспорта
    """
    # entry_date устанавливается автоматически при создании
    # violations_count вычисляется автоматически
    # is_emergency по умолчанию False
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
    city: Optional[str] = Field(None, min_length=2, max_length=100)


class PassportEmergencyUpdate(BaseModel):
    """
    Схема для изменения ЧС статуса
    """
    is_emergency: bool = Field(..., description="ЧС статус")
    reason: Optional[str] = Field(None, max_length=500, description="Причина добавления/удаления из ЧС")


class Passport(PassportBase):
    """
    Схема паспорта для ответа
    """
    id: int
    violations_count: int
    entry_date: datetime
    is_emergency: bool
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
    city: str
    violations_count: int
    is_emergency: bool

    class Config:
        from_attributes = True


class PassportEmergencyResponse(BaseModel):
    """
    Ответ на изменение ЧС статуса
    """
    id: int
    nickname: str
    is_emergency: bool
    message: str

    class Config:
        from_attributes = True