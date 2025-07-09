from typing import Optional, Any, Dict
from sqlalchemy.orm import Session
from fastapi import Request

from app.crud.log import log_crud
from app.models.user import User


class ActionLogger:
    """
    Класс для логирования действий пользователей
    """
    
    @staticmethod
    def log_action(
        db: Session,
        user: User,
        action: str,
        entity_type: str,
        entity_id: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
        request: Optional[Request] = None
    ) -> None:
        """
        Логирование действия пользователя
        
        Args:
            db: Сессия базы данных
            user: Пользователь, выполнивший действие
            action: Тип действия (CREATE, UPDATE, DELETE, VIEW)
            entity_type: Тип сущности (passport, fine, user)
            entity_id: ID сущности (если применимо)
            details: Дополнительные данные
            request: HTTP запрос для получения IP
        """
        ip_address = None
        if request:
            # Попытка получить реальный IP из заголовков
            ip_address = (
                request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
                or request.headers.get("X-Real-IP")
                or str(request.client.host) if request.client else None
            )
        
        log_crud.create_log(
            db=db,
            user_id=user.id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
            ip_address=ip_address
        )

    @staticmethod
    def log_passport_created(
        db: Session, 
        user: User, 
        passport_id: int,
        passport_data: dict,
        request: Optional[Request] = None
    ) -> None:
        """Логирование создания паспорта"""
        ActionLogger.log_action(
            db=db,
            user=user,
            action="CREATE",
            entity_type="passport",
            entity_id=passport_id,
            details={
                "nickname": passport_data.get("nickname"),
                "full_name": f"{passport_data.get('first_name')} {passport_data.get('last_name')}"
            },
            request=request
        )

    @staticmethod
    def log_passport_updated(
        db: Session, 
        user: User, 
        passport_id: int,
        old_data: dict,
        new_data: dict,
        request: Optional[Request] = None
    ) -> None:
        """Логирование обновления паспорта"""
        ActionLogger.log_action(
            db=db,
            user=user,
            action="UPDATE",
            entity_type="passport",
            entity_id=passport_id,
            details={
                "old_data": old_data,
                "new_data": new_data
            },
            request=request
        )

    @staticmethod
    def log_passport_deleted(
        db: Session, 
        user: User, 
        passport_id: int,
        passport_data: dict,
        request: Optional[Request] = None
    ) -> None:
        """Логирование удаления паспорта"""
        ActionLogger.log_action(
            db=db,
            user=user,
            action="DELETE",
            entity_type="passport",
            entity_id=passport_id,
            details={
                "nickname": passport_data.get("nickname"),
                "full_name": f"{passport_data.get('first_name')} {passport_data.get('last_name')}"
            },
            request=request
        )

    @staticmethod
    def log_fine_created(
        db: Session, 
        user: User, 
        fine_id: int,
        fine_data: dict,
        request: Optional[Request] = None
    ) -> None:
        """Логирование создания штрафа"""
        ActionLogger.log_action(
            db=db,
            user=user,
            action="CREATE",
            entity_type="fine",
            entity_id=fine_id,
            details={
                "passport_id": fine_data.get("passport_id"),
                "article": fine_data.get("article"),
                "amount": fine_data.get("amount")
            },
            request=request
        )

    @staticmethod
    def log_fine_updated(
        db: Session, 
        user: User, 
        fine_id: int,
        old_data: dict,
        new_data: dict,
        request: Optional[Request] = None
    ) -> None:
        """Логирование обновления штрафа"""
        ActionLogger.log_action(
            db=db,
            user=user,
            action="UPDATE",
            entity_type="fine",
            entity_id=fine_id,
            details={
                "old_data": old_data,
                "new_data": new_data
            },
            request=request
        )

    @staticmethod
    def log_fine_deleted(
        db: Session, 
        user: User, 
        fine_id: int,
        fine_data: dict,
        request: Optional[Request] = None
    ) -> None:
        """Логирование удаления штрафа"""
        ActionLogger.log_action(
            db=db,
            user=user,
            action="DELETE",
            entity_type="fine",
            entity_id=fine_id,
            details={
                "passport_id": fine_data.get("passport_id"),
                "article": fine_data.get("article"),
                "amount": fine_data.get("amount")
            },
            request=request
        )

    @staticmethod
    def log_user_login(
        db: Session, 
        user: User,
        request: Optional[Request] = None
    ) -> None:
        """Логирование входа пользователя"""
        ActionLogger.log_action(
            db=db,
            user=user,
            action="LOGIN",
            entity_type="user",
            entity_id=user.id,
            details={"username": user.username},
            request=request
        )