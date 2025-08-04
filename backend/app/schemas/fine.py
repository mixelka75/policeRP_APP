from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class FineBase(BaseModel):
    """
    Базовая схема штрафа
    """
    passport_id: int = Field(..., description="ID паспорта")
    article: str = Field(..., min_length=1, max_length=200, description="Статья нарушения")
    amount: int = Field(..., ge=1, description="Сумма штрафа в рублях")
    description: Optional[str] = Field(None, max_length=1000, description="Описание")


class FineCreate(FineBase):
    """
    Схема для создания штрафа
    """
    pass


class FineUpdate(BaseModel):
    """
    Схема для обновления штрафа
    """
    article: Optional[str] = Field(None, min_length=1, max_length=200)
    amount: Optional[int] = Field(None, ge=1)
    description: Optional[str] = Field(None, max_length=1000)


class IssuerInfo(BaseModel):
    """
    Информация о выписавшем штраф сотруднике
    """
    user_id: int
    discord_username: str
    minecraft_username: Optional[str] = None


class Fine(FineBase):
    """
    Схема штрафа для ответа
    """
    id: int
    created_by_user_id: int
    is_paid: bool = Field(default=False, description="Статус оплаты штрафа")
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class FineWithDetails(FineBase):
    """
    Схема штрафа с подробной информацией о выписавшем
    """
    id: int
    created_by_user_id: int
    is_paid: bool = Field(default=False, description="Статус оплаты штрафа")
    created_at: datetime
    updated_at: datetime
    issuer_info: Optional[IssuerInfo] = None
    
    class Config:
        from_attributes = True


class FineInPassport(BaseModel):
    """
    Схема штрафа для отображения в паспорте
    """
    id: int
    article: str
    amount: int
    description: Optional[str]
    is_paid: bool = Field(default=False, description="Статус оплаты штрафа")
    created_at: datetime
    created_by_user_id: int
    
    class Config:
        from_attributes = True