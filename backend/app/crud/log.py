from typing import List, Optional
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.crud.base import CRUDBase
from app.models.log import Log
from app.schemas.log import LogCreate, LogBase


class CRUDLog(CRUDBase[Log, LogCreate, LogBase]):
    """
    CRUD операции для логов
    """
    
    def create_log(
        self, 
        db: Session, 
        *, 
        user_id: int,
        action: str,
        entity_type: str,
        entity_id: int = None,
        details: dict = None,
        ip_address: str = None
    ) -> Log:
        """
        Создать лог действия пользователя
        """
        db_obj = Log(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
            ip_address=ip_address
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_user_id(
        self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100
    ) -> List[Log]:
        """
        Получить логи по ID пользователя
        """
        return (
            db.query(Log)
            .filter(Log.user_id == user_id)
            .order_by(Log.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_action(
        self, db: Session, *, action: str, skip: int = 0, limit: int = 100
    ) -> List[Log]:
        """
        Получить логи по типу действия
        """
        return (
            db.query(Log)
            .filter(Log.action == action)
            .order_by(Log.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_entity_type(
        self, db: Session, *, entity_type: str, skip: int = 0, limit: int = 100
    ) -> List[Log]:
        """
        Получить логи по типу сущности
        """
        return (
            db.query(Log)
            .filter(Log.entity_type == entity_type)
            .order_by(Log.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_entity(
        self, db: Session, *, entity_type: str, entity_id: int
    ) -> List[Log]:
        """
        Получить логи по конкретной сущности
        """
        return (
            db.query(Log)
            .filter(Log.entity_type == entity_type, Log.entity_id == entity_id)
            .order_by(Log.created_at.desc())
            .all()
        )

    def get_by_date_range(
        self, 
        db: Session, 
        *, 
        start_date: datetime = None, 
        end_date: datetime = None,
        skip: int = 0, 
        limit: int = 100
    ) -> List[Log]:
        """
        Получить логи за определенный период
        """
        query = db.query(Log)
        
        if start_date:
            query = query.filter(Log.created_at >= start_date)
        if end_date:
            query = query.filter(Log.created_at <= end_date)
        
        return (
            query.order_by(Log.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_ip_address(
        self, db: Session, *, ip_address: str, skip: int = 0, limit: int = 100
    ) -> List[Log]:
        """
        Получить логи по IP адресу
        """
        return (
            db.query(Log)
            .filter(Log.ip_address == ip_address)
            .order_by(Log.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_activity_stats(
        self, db: Session, *, user_id: int = None, days: int = 30
    ) -> dict:
        """
        Получить статистику активности пользователя
        """
        from datetime import timedelta
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        query = db.query(Log).filter(Log.created_at >= start_date)
        
        if user_id:
            query = query.filter(Log.user_id == user_id)
        
        logs = query.all()
        
        stats = {
            "total_actions": len(logs),
            "actions_by_type": {},
            "entities_by_type": {},
            "daily_activity": {}
        }
        
        for log in logs:
            # Статистика по типам действий
            if log.action not in stats["actions_by_type"]:
                stats["actions_by_type"][log.action] = 0
            stats["actions_by_type"][log.action] += 1
            
            # Статистика по типам сущностей
            if log.entity_type not in stats["entities_by_type"]:
                stats["entities_by_type"][log.entity_type] = 0
            stats["entities_by_type"][log.entity_type] += 1
            
            # Ежедневная активность
            date_str = log.created_at.strftime("%Y-%m-%d")
            if date_str not in stats["daily_activity"]:
                stats["daily_activity"][date_str] = 0
            stats["daily_activity"][date_str] += 1
        
        return stats

    def get_multi_with_user(
        self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[Log]:
        """
        Получить список логов с информацией о пользователе
        """
        return (
            db.query(Log)
            .options(db.joinedload(Log.user))
            .order_by(Log.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )


log_crud = CRUDLog(Log)