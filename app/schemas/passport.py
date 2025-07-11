from pydantic import BaseModel, Field, computed_field
from typing import Optional, List
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
    # city_entry_date устанавливается автоматически при создании
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
    # city_entry_date НЕ включено - дата входа не изменяется при редактировании


class Passport(PassportBase):
    """
    Схема паспорта для ответа
    """
    id: int
    city_entry_date: datetime
    created_at: datetime
    updated_at: datetime

    # Вычисляемое поле для количества нарушений
    @computed_field
    @property
    def violations_count(self) -> int:
        """Количество нарушений (штрафов)"""
        if hasattr(self, 'fines') and self.fines:
            return len(self.fines)
        return 0

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
    violations_count: int = 0

    class Config:
        from_attributes = True


class PassportWithFines(Passport):
    """
    Паспорт с полной информацией о штрафах
    """
    from app.schemas.fine import FineInPassport
    fines: List[FineInPassport] = []

    class Config:
        from_attributes = True