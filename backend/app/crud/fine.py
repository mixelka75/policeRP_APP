from typing import List, Optional
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.crud.base import CRUDBase
from app.models.fine import Fine
from app.schemas.fine import FineCreate, FineUpdate


class CRUDFine(CRUDBase[Fine, FineCreate, FineUpdate]):
    """
    CRUD операции для штрафов
    """
    
    def create_with_user(
        self, db: Session, *, obj_in: FineCreate, created_by_user_id: int
    ) -> Fine:
        """
        Создать штраф с указанием пользователя, который его создал
        """
        obj_in_data = obj_in.model_dump()
        obj_in_data["created_by_user_id"] = created_by_user_id
        db_obj = Fine(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_passport_id(
        self, db: Session, *, passport_id: int, skip: int = 0, limit: int = 100
    ) -> List[Fine]:
        """
        Получить штрафы по ID паспорта
        """
        return (
            db.query(Fine)
            .filter(Fine.passport_id == passport_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_user_id(
        self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100
    ) -> List[Fine]:
        """
        Получить штрафы, созданные определенным пользователем
        """
        return (
            db.query(Fine)
            .filter(Fine.created_by_user_id == user_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_article(
        self, db: Session, *, article: str, skip: int = 0, limit: int = 100
    ) -> List[Fine]:
        """
        Получить штрафы по статье
        """
        return (
            db.query(Fine)
            .filter(Fine.article.ilike(f"%{article}%"))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_amount_range(
        self, db: Session, *, min_amount: int = None, max_amount: int = None
    ) -> List[Fine]:
        """
        Получить штрафы в определенном диапазоне сумм
        """
        query = db.query(Fine)
        
        if min_amount is not None:
            query = query.filter(Fine.amount >= min_amount)
        if max_amount is not None:
            query = query.filter(Fine.amount <= max_amount)
        
        return query.all()

    def get_by_date_range(
        self, 
        db: Session, 
        *, 
        start_date: datetime = None, 
        end_date: datetime = None
    ) -> List[Fine]:
        """
        Получить штрафы за определенный период
        """
        query = db.query(Fine)
        
        if start_date:
            query = query.filter(Fine.created_at >= start_date)
        if end_date:
            query = query.filter(Fine.created_at <= end_date)
        
        return query.all()

    def get_total_amount_by_passport(self, db: Session, *, passport_id: int) -> int:
        """
        Получить общую сумму штрафов по паспорту
        """
        result = db.query(func.sum(Fine.amount)).filter(Fine.passport_id == passport_id).scalar()
        return result or 0

    def get_statistics_by_user(self, db: Session, *, user_id: int) -> dict:
        """
        Получить статистику штрафов по пользователю
        """
        total_fines = db.query(func.count(Fine.id)).filter(Fine.created_by_user_id == user_id).scalar()
        total_amount = db.query(func.sum(Fine.amount)).filter(Fine.created_by_user_id == user_id).scalar()
        
        return {
            "total_fines": total_fines or 0,
            "total_amount": total_amount or 0
        }

    def get_multi_with_details(
        self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[Fine]:
        """
        Получить список штрафов с подробной информацией
        """
        return (
            db.query(Fine)
            .options(
                db.joinedload(Fine.passport),
                db.joinedload(Fine.created_by)
            )
            .offset(skip)
            .limit(limit)
            .all()
        )


fine_crud = CRUDFine(Fine)