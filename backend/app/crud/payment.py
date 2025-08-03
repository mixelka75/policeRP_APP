from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
import json

from app.crud.base import CRUDBase
from app.models.payment import Payment
from app.models.fine import Fine
from app.schemas.payment import PaymentCreate, PaymentUpdate


class CRUDPayment(CRUDBase[Payment, PaymentCreate, PaymentUpdate]):
    """
    CRUD операции для платежей
    """
    
    def create_payment(self, db: Session, *, payment_in: PaymentCreate, total_amount: float) -> Payment:
        """Создать новый платеж"""
        fine_ids_json = json.dumps(payment_in.fine_ids)
        
        payment = Payment(
            passport_id=payment_in.passport_id,
            fine_ids=fine_ids_json,
            total_amount=total_amount,
            status="pending"
        )
        
        db.add(payment)
        db.commit()
        db.refresh(payment)
        return payment
    
    def get_by_spworlds_id(self, db: Session, *, spworlds_payment_id: str) -> Optional[Payment]:
        """Получить платеж по ID от SP-Worlds"""
        return db.query(Payment).filter(Payment.spworlds_payment_id == spworlds_payment_id).first()
    
    def get_unpaid_fines_total(self, db: Session, *, fine_ids: List[int]) -> float:
        """Получить общую сумму неоплаченных штрафов"""
        total = db.query(Fine).filter(
            and_(
                Fine.id.in_(fine_ids),
                Fine.is_paid == False
            )
        ).with_entities(db.func.sum(Fine.amount)).scalar()
        
        return float(total or 0)
    
    def get_payment_fines(self, db: Session, *, payment: Payment) -> List[Fine]:
        """Получить штрафы, связанные с платежом"""
        fine_ids = json.loads(payment.fine_ids)
        return db.query(Fine).filter(Fine.id.in_(fine_ids)).all()
    
    def mark_fines_as_paid(self, db: Session, *, fine_ids: List[int]) -> None:
        """Отметить штрафы как оплаченные"""
        db.query(Fine).filter(Fine.id.in_(fine_ids)).update(
            {"is_paid": True}, 
            synchronize_session=False
        )
        db.commit()
    
    def get_by_passport(self, db: Session, *, passport_id: int) -> List[Payment]:
        """Получить все платежи паспорта"""
        return db.query(Payment).filter(Payment.passport_id == passport_id).all()
    
    def complete_payment(
        self, 
        db: Session, 
        *, 
        payment: Payment, 
        payer_nickname: str,
        webhook_data: str
    ) -> Payment:
        """Завершить платеж успешно"""
        from datetime import datetime
        
        # Обновляем статус платежа
        payment.status = "completed"
        payment.payer_nickname = payer_nickname
        payment.webhook_data = webhook_data
        payment.paid_at = datetime.now()
        
        # Отмечаем штрафы как оплаченные
        fine_ids = json.loads(payment.fine_ids)
        self.mark_fines_as_paid(db, fine_ids=fine_ids)
        
        db.commit()
        db.refresh(payment)
        return payment


payment = CRUDPayment(Payment)