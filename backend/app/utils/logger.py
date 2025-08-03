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
            user: Optional[User],
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
            user: Пользователь, выполнивший действие (может быть None для анонимных действий)
            action: Тип действия (CREATE, UPDATE, DELETE, VIEW, LOGIN, etc.)
            entity_type: Тип сущности (passport, fine, user)
            entity_id: ID сущности (если применимо)
            details: Дополнительные данные
            request: HTTP запрос для получения IP
        """
        # Если пользователь не указан, не логируем (для неудачных попыток входа)
        if user is None:
            return

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
                "full_name": f"{passport_data.get('first_name')} {passport_data.get('last_name')}",
                "age": passport_data.get("age"),
                "gender": passport_data.get("gender")
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
        # Определяем изменения
        changes = {}
        for key in new_data:
            if old_data.get(key) != new_data.get(key):
                changes[key] = {
                    "old": old_data.get(key),
                    "new": new_data.get(key)
                }

        # Получаем актуальные данные паспорта из базы для полной информации
        from app.crud.passport import passport_crud
        current_passport = passport_crud.get(db, id=passport_id)
        
        # Формируем полный набор данных для логирования
        log_details = {
            "changes": changes,
            # Используем новые данные если они есть, иначе текущие из БД, иначе старые
            "nickname": new_data.get("nickname") or (current_passport.nickname if current_passport else None) or old_data.get("nickname"),
            "first_name": new_data.get("first_name") or (current_passport.first_name if current_passport else None) or old_data.get("first_name"),
            "last_name": new_data.get("last_name") or (current_passport.last_name if current_passport else None) or old_data.get("last_name"),
            "discord_id": new_data.get("discord_id") or (current_passport.discord_id if current_passport else None) or old_data.get("discord_id"),
            "age": new_data.get("age") or (current_passport.age if current_passport else None) or old_data.get("age"),
            "city": new_data.get("city") or (current_passport.city if current_passport else None) or old_data.get("city"),
            "gender": new_data.get("gender") or (current_passport.gender if current_passport else None) or old_data.get("gender")
        }
        
        # Добавляем full_name для удобства фильтрации
        if log_details["first_name"] and log_details["last_name"]:
            log_details["full_name"] = f"{log_details['first_name']} {log_details['last_name']}"
        
        # Добавляем информацию об исполнителе
        log_details["officer"] = user.minecraft_username or user.discord_username

        ActionLogger.log_action(
            db=db,
            user=user,
            action="UPDATE",
            entity_type="passport",
            entity_id=passport_id,
            details=log_details,
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
                "full_name": f"{passport_data.get('first_name')} {passport_data.get('last_name')}",
                "age": passport_data.get("age"),
                "gender": passport_data.get("gender")
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
        # Получаем информацию о паспорте для полного логирования
        passport_info = None
        if fine_data.get("passport_id"):
            from app.crud.passport import passport_crud
            passport = passport_crud.get(db, id=fine_data.get("passport_id"))
            if passport:
                passport_info = {
                    "first_name": passport.first_name,
                    "last_name": passport.last_name,
                    "nickname": passport.nickname,
                    "discord_id": passport.discord_id,
                    "age": passport.age,
                    "city": passport.city
                }
        
        ActionLogger.log_action(
            db=db,
            user=user,
            action="CREATE",
            entity_type="fine",
            entity_id=fine_id,
            details={
                "passport_id": fine_data.get("passport_id"),
                "passport_info": passport_info,
                "article": fine_data.get("article"),
                "amount": fine_data.get("amount"),
                "description": fine_data.get("description"),
                "officer": user.minecraft_username or user.discord_username
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
        # Определяем изменения
        changes = {}
        for key in new_data:
            if old_data.get(key) != new_data.get(key):
                changes[key] = {
                    "old": old_data.get(key),
                    "new": new_data.get(key)
                }

        # Получаем информацию о паспорте
        passport_info = None
        passport_id = new_data.get("passport_id") or old_data.get("passport_id")
        if passport_id:
            from app.crud.passport import passport_crud
            passport = passport_crud.get(db, id=passport_id)
            if passport:
                passport_info = {
                    "first_name": passport.first_name,
                    "last_name": passport.last_name,
                    "nickname": passport.nickname,
                    "discord_id": passport.discord_id,
                    "age": passport.age,
                    "city": passport.city
                }

        ActionLogger.log_action(
            db=db,
            user=user,
            action="UPDATE",
            entity_type="fine",
            entity_id=fine_id,
            details={
                "changes": changes,
                "passport_id": passport_id,
                "passport_info": passport_info,
                "current_amount": new_data.get("amount"),
                "article": new_data.get("article") or old_data.get("article"),
                "officer": user.minecraft_username or user.discord_username
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
        # Получаем информацию о паспорте
        passport_info = None
        if fine_data.get("passport_id"):
            from app.crud.passport import passport_crud
            passport = passport_crud.get(db, id=fine_data.get("passport_id"))
            if passport:
                passport_info = {
                    "first_name": passport.first_name,
                    "last_name": passport.last_name,
                    "nickname": passport.nickname,
                    "discord_id": passport.discord_id,
                    "age": passport.age,
                    "city": passport.city
                }
        
        ActionLogger.log_action(
            db=db,
            user=user,
            action="DELETE",
            entity_type="fine",
            entity_id=fine_id,
            details={
                "passport_id": fine_data.get("passport_id"),
                "passport_info": passport_info,
                "article": fine_data.get("article"),
                "amount": fine_data.get("amount"),
                "description": fine_data.get("description"),
                "officer": user.minecraft_username or user.discord_username
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
            details={
                "username": user.discord_username,
                "role": user.role
            },
            request=request
        )

    @staticmethod
    def log_user_logout(
            db: Session,
            user: User,
            request: Optional[Request] = None
    ) -> None:
        """Логирование выхода пользователя"""
        ActionLogger.log_action(
            db=db,
            user=user,
            action="LOGOUT",
            entity_type="user",
            entity_id=user.id,
            details={
                "username": user.discord_username
            },
            request=request
        )

    @staticmethod
    def log_search_action(
            db: Session,
            user: User,
            search_type: str,
            search_query: str,
            results_count: int,
            request: Optional[Request] = None
    ) -> None:
        """Логирование поисковых запросов"""
        ActionLogger.log_action(
            db=db,
            user=user,
            action="SEARCH",
            entity_type=search_type,
            details={
                "query": search_query,
                "results_count": results_count,
                "search_type": search_type
            },
            request=request
        )

    @staticmethod
    def log_bulk_action(
            db: Session,
            user: User,
            action: str,
            entity_type: str,
            entity_ids: list,
            request: Optional[Request] = None
    ) -> None:
        """Логирование массовых операций"""
        ActionLogger.log_action(
            db=db,
            user=user,
            action=f"BULK_{action}",
            entity_type=entity_type,
            details={
                "entity_ids": entity_ids,
                "count": len(entity_ids),
                "action_type": action
            },
            request=request
        )

    @staticmethod
    def log_export_action(
            db: Session,
            user: User,
            export_type: str,
            entity_count: int,
            export_format: str = "CSV",
            request: Optional[Request] = None
    ) -> None:
        """Логирование экспорта данных"""
        ActionLogger.log_action(
            db=db,
            user=user,
            action="EXPORT",
            entity_type=export_type,
            details={
                "export_format": export_format,
                "entity_count": entity_count,
                "export_type": export_type
            },
            request=request
        )

    @staticmethod
    def log_security_event(
            db: Session,
            user: Optional[User],
            event_type: str,
            details: dict,
            request: Optional[Request] = None
    ) -> None:
        """Логирование событий безопасности"""
        if user:
            ActionLogger.log_action(
                db=db,
                user=user,
                action="SECURITY_EVENT",
                entity_type="security",
                details={
                    "event_type": event_type,
                    **details
                },
                request=request
            )

    @staticmethod
    def log_anonymous_security_event(
            db: Session,
            event_type: str,
            details: dict,
            request: Optional[Request] = None
    ) -> None:
        """Логирование анонимных событий безопасности (например, неудачные попытки входа)"""
        ip_address = None
        if request:
            # Попытка получить реальный IP из заголовков
            ip_address = (
                request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
                or request.headers.get("X-Real-IP")
                or str(request.client.host) if request.client else None
            )

        # Создаем лог без пользователя - для анонимных событий
        # Используем user_id = None для анонимных событий
        try:
            from app.models.log import Log
            log_entry = Log(
                user_id=None,  # NULL для анонимных событий
                action="SECURITY_EVENT",
                entity_type="security",
                details={
                    "event_type": event_type,
                    "anonymous": True,
                    **details
                },
                ip_address=ip_address
            )
            db.add(log_entry)
            db.commit()
        except Exception as e:
            # В случае ошибки логирования, не падаем
            print(f"Ошибка при логировании анонимного события: {e}")
            db.rollback()