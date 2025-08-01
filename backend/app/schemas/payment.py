from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class PaymentBase(BaseModel):
    """Базовая схема платежа"""
    fine_ids: List[int] = Field(..., description="Список ID штрафов для оплаты")


class PaymentCreate(PaymentBase):
    """Схема для создания платежа"""
    passport_id: int = Field(..., description="ID паспорта")


class PaymentUpdate(BaseModel):
    """Схема для обновления платежа"""
    status: Optional[str] = None
    spworlds_payment_id: Optional[str] = None
    payment_url: Optional[str] = None
    webhook_data: Optional[str] = None
    payer_nickname: Optional[str] = None
    paid_at: Optional[datetime] = None


class PaymentResponse(PaymentBase):
    """Схема ответа для платежа"""
    id: int
    passport_id: int
    total_amount: float
    status: str
    payment_url: Optional[str] = None
    payer_nickname: Optional[str] = None
    created_at: datetime
    paid_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PaymentWebhook(BaseModel):
    """Схема для webhook'а от SP-Worlds"""
    payer: str = Field(..., description="Никнейм игрока, совершившего платеж")
    amount: float = Field(..., description="Сумма платежа")
    data: Optional[str] = Field(None, description="Дополнительные данные")


class SPWorldsPaymentItem(BaseModel):
    """Элемент для создания платежа в SP-Worlds"""
    name: str = Field(..., min_length=3, max_length=32, description="Название товара")
    count: int = Field(..., ge=1, le=9999, description="Количество")
    price: int = Field(..., ge=1, le=172800, description="Цена за единицу в AR")  
    comment: Optional[str] = Field(None, min_length=3, max_length=64, description="Комментарий")


class SPWorldsPaymentCreate(BaseModel):
    """Запрос для создания платежа в SP-Worlds"""
    items: List[SPWorldsPaymentItem] = Field(..., description="Список товаров")
    redirectUrl: str = Field(..., description="URL для редиректа после оплаты")
    webhookUrl: str = Field(..., description="URL для webhook'а")
    data: Optional[str] = Field(None, max_length=100, description="Дополнительные данные")


class SPWorldsPaymentResponse(BaseModel):
    """Ответ от SP-Worlds при создании платежа"""
    success: bool
    url: Optional[str] = None
    message: Optional[str] = None