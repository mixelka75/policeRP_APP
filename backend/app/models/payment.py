from sqlalchemy import Column, String, Integer, Float, ForeignKey, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.models.base import BaseModel


class Payment(BaseModel):
    """
    Модель платежа для оплаты штрафов через SP-Worlds
    """
    __tablename__ = "payments"
    
    # Основная информация о платеже
    passport_id = Column(Integer, ForeignKey("passports.id"), nullable=False, index=True)
    fine_ids = Column(String(500), nullable=False)  # JSON массив ID штрафов: "[1,2,3]"
    
    # Данные платежа SP-Worlds
    total_amount = Column(Float, nullable=False)  # Общая сумма к оплате в AR
    spworlds_payment_id = Column(String(100), nullable=True, unique=True)  # ID платежа от SP-Worlds
    
    # Статус платежа
    status = Column(String(20), nullable=False, default="pending")  # pending, completed, failed, cancelled
    
    # Метаданные
    payment_url = Column(String(500), nullable=True)  # URL для оплаты от SP-Worlds
    webhook_data = Column(Text, nullable=True)  # Данные от webhook'а SP-Worlds
    
    # Информация об оплачивающем
    payer_nickname = Column(String(100), nullable=True)  # Никнейм оплатившего (от webhook)
    
    # Временные метки
    paid_at = Column(DateTime(timezone=True), nullable=True)  # Время успешной оплаты
    expires_at = Column(DateTime(timezone=True), nullable=True)  # Время истечения ссылки на оплату
    
    # Связи
    passport = relationship("Passport", back_populates="payments")