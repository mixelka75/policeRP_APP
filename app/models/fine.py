from sqlalchemy import Column, String, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Fine(BaseModel):
    """
    Модель штрафа
    """
    __tablename__ = "fines"
    
    passport_id = Column(Integer, ForeignKey("passports.id"), nullable=False, index=True)
    article = Column(String(200), nullable=False)
    amount = Column(Integer, nullable=False)  # Сумма штрафа в рублях
    description = Column(Text, nullable=True)  # Дополнительное описание
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Связи
    passport = relationship("Passport", back_populates="fines")
    created_by = relationship("User", back_populates="created_fines", foreign_keys=[created_by_user_id])