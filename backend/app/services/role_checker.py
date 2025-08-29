import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.config import settings
from app.crud.user import user_crud
from app.models.user import User
from app.clients.discord import discord_client
from app.clients.spworlds import spworlds_client
from app.utils.logger import ActionLogger

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RoleCheckerService:
    """
    Сервис для периодической проверки ролей пользователей
    """

    def __init__(self):
        self.is_running = False
        self.guild_roles_cache: Optional[List[Dict[str, Any]]] = None
        self.cache_updated_at: Optional[datetime] = None
        # Кеш для пользовательских ролей (кеш на 2 минуты)
        self.user_roles_cache: Dict[int, Dict[str, Any]] = {}
        self.user_cache_expiry: Dict[int, datetime] = {}

    async def start(self):
        """
        Запуск сервиса проверки ролей
        """
        self.is_running = True
        logger.info("Role checker service started")

        while self.is_running:
            try:
                await self.check_all_users_roles()
                await asyncio.sleep(settings.ROLE_CHECK_INTERVAL * 60)  # Конвертируем минуты в секунды
            except Exception as e:
                logger.error(f"Error in role checker service: {e}")
                await asyncio.sleep(60)  # Ждем минуту перед повторной попыткой

    async def stop(self):
        """
        Остановка сервиса
        """
        self.is_running = False
        logger.info("Role checker service stopped")

    async def check_all_users_roles(self, force: bool = False):
        """
        Проверка ролей всех пользователей
        
        Args:
            force: Принудительная проверка всех пользователей, игнорируя кеш
        """
        logger.info(f"Starting role check for all users (force={force})")
        
        # Если принудительная проверка, очищаем весь кеш
        if force:
            logger.info("Forcing role check for all users, clearing entire cache")
            self.user_roles_cache.clear()
            self.user_cache_expiry.clear()

        db = SessionLocal()
        try:
            if force:
                # При принудительной проверке берем всех активных пользователей
                users = user_crud.get_active_users(db)
            else:
                # Получаем пользователей, которым нужно проверить роли
                users = user_crud.get_users_for_role_check(
                    db,
                    minutes_ago=settings.ROLE_CHECK_INTERVAL
                )

            logger.info(f"Found {len(users)} users to check")

            # Проверяем каждого пользователя
            for user in users:
                try:
                    result = await self.check_user_roles(db, user)
                    if result:
                        if result.get("changed"):
                            logger.info(
                                f"User {user.discord_username} role changed from {result['old_role']} to {result['new_role']}")

                        if not result.get("has_access"):
                            logger.warning(f"User {user.discord_username} lost access to the server")
                            # Деактивируем пользователя
                            user_crud.deactivate_user(db, user=user)

                except Exception as e:
                    logger.error(f"Error checking roles for user {user.discord_username}: {e}")

                # Небольшая задержка между проверками
                await asyncio.sleep(0.5)
        finally:
            db.close()

    async def check_user_roles(self, db: Session, user: User) -> Optional[Dict[str, Any]]:
        """
        Проверка ролей конкретного пользователя

        Args:
            db: Сессия базы данных
            user: Пользователь для проверки

        Returns:
            Результат проверки
        """
        try:
            # Проверяем, не истек ли Discord токен
            if user.discord_expires_at and user.discord_expires_at < datetime.now(timezone.utc):
                if user.discord_refresh_token:
                    # Пытаемся обновить токен
                    token_data = await discord_client.refresh_token(user.discord_refresh_token)
                    if token_data:
                        access_token = token_data["access_token"]
                        refresh_token = token_data["refresh_token"]
                        expires_in = token_data["expires_in"]
                        expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

                        user_crud.update_discord_data(
                            db,
                            user=user,
                            discord_access_token=access_token,
                            discord_refresh_token=refresh_token,
                            discord_expires_at=expires_at
                        )
                        user.discord_access_token = access_token
                    else:
                        logger.warning(f"Failed to refresh token for user {user.discord_username}")
                        # Если пользователь администратор, не блокируем его даже при проблемах с токеном
                        if user.role == "admin":
                            logger.info(f"Preserving admin access for user {user.discord_username} despite token issues")
                            
                            # Если администратор был заблокирован, активируем его обратно
                            if not user.is_active:
                                logger.info(f"Reactivating admin user {user.discord_username}")
                                user_crud.activate_user(db, user=user)
                            
                            return {
                                "user_id": user.id,
                                "old_role": user.role,
                                "new_role": user.role,
                                "changed": False,
                                "has_access": True,
                                "minecraft_data_updated": False
                            }
                        return {"has_access": False, "changed": False}
                else:
                    logger.warning(f"No refresh token for user {user.discord_username}")
                    # Если пользователь администратор, не блокируем его даже без refresh токена
                    if user.role == "admin":
                        logger.info(f"Preserving admin access for user {user.discord_username} despite missing refresh token")
                        
                        # Если администратор был заблокирован, активируем его обратно
                        if not user.is_active:
                            logger.info(f"Reactivating admin user {user.discord_username}")
                            user_crud.activate_user(db, user=user)
                        
                        return {
                            "user_id": user.id,
                            "old_role": user.role,
                            "new_role": user.role,
                            "changed": False,
                            "has_access": True,
                            "minecraft_data_updated": False
                        }
                    return {"has_access": False, "changed": False}

            # Получаем информацию о пользователе в гильдии
            member_info = await discord_client.get_guild_member(
                user.discord_access_token,
                settings.DISCORD_GUILD_ID
            )

            if not member_info:
                logger.info(f"User {user.discord_username} is not in the guild")
                
                # Проверяем кеш пользователя - если данные свежие, не меняем роль
                if self._is_user_cache_valid(user.id):
                    cached_data = self.user_roles_cache[user.id]
                    logger.info(f"Using cached role data for user {user.discord_username}")
                    return {
                        "user_id": user.id,
                        "old_role": user.role,
                        "new_role": user.role,
                        "changed": False,
                        "has_access": True,
                        "minecraft_data_updated": False
                    }
                
                # Если пользователь администратор, сохраняем его роль даже если он не в гильдии
                if user.role == "admin":
                    logger.info(f"Preserving admin role for user {user.discord_username} even though not in guild")
                    
                    # Если администратор был заблокирован, активируем его обратно
                    if not user.is_active:
                        logger.info(f"Reactivating admin user {user.discord_username}")
                        user_crud.activate_user(db, user=user)
                    
                    # Обновляем кеш
                    self._update_user_cache(user.id, {"role": user.role, "has_access": True})
                    
                    return {
                        "user_id": user.id,
                        "old_role": user.role,
                        "new_role": user.role,
                        "changed": False,
                        "has_access": True,
                        "minecraft_data_updated": False
                    }
                
                # Пользователь не в сервере, назначаем роль citizen
                new_role = "citizen"
                old_role = user.role
                
                # Обновляем данные пользователя
                user_crud.update_discord_data(
                    db,
                    user=user,
                    role=new_role,
                    discord_roles=[]
                )
                
                # Обновляем кеш
                self._update_user_cache(user.id, {"role": new_role, "has_access": True})
                
                # Если пользователь был деактивирован, но теперь получил роль citizen, активируем его
                if not user.is_active and new_role == "citizen":
                    logger.info(f"Reactivating user {user.discord_username} due to citizen role assignment")
                    user_crud.activate_user(db, user=user)

                # Логируем изменения
                if old_role != new_role:
                    ActionLogger.log_action(
                        db=db,
                        user=user,
                        action="ROLE_CHANGED",
                        entity_type="user",
                        entity_id=user.id,
                        details={
                            "old_role": old_role,
                            "new_role": new_role,
                            "changed_by": "role_checker_service",
                            "reason": "user_not_in_guild"
                        }
                    )
                
                return {
                    "user_id": user.id,
                    "old_role": old_role,
                    "new_role": new_role,
                    "changed": old_role != new_role,
                    "has_access": True,
                    "minecraft_data_updated": False
                }

            # Получаем роли гильдии (кешируем на 5 минут)
            guild_roles = await self.get_guild_roles()

            # Определяем новую роль пользователя
            new_role = self.determine_user_role(member_info, guild_roles, user, db)
            old_role = user.role

            # Получаем обновленные данные из SP-Worlds
            print(f"DEBUG ROLE_CHECKER: Fetching SP-Worlds data for Discord ID: {user.discord_id}")
            spworlds_data = await spworlds_client.find_user(str(user.discord_id))
            print(f"DEBUG ROLE_CHECKER: SP-Worlds response: {spworlds_data}")
            minecraft_username = spworlds_data.get("username") if spworlds_data else None
            minecraft_uuid = spworlds_data.get("uuid") if spworlds_data else None
            print(f"DEBUG ROLE_CHECKER: Extracted minecraft_username: {minecraft_username}, minecraft_uuid: {minecraft_uuid}")

            minecraft_data_updated = (
                    user.minecraft_username != minecraft_username or
                    user.minecraft_uuid != minecraft_uuid
            )

            # Обновляем данные пользователя
            user_crud.update_discord_data(
                db,
                user=user,
                role=new_role,
                discord_roles=member_info.get("roles", []),
                minecraft_username=minecraft_username,
                minecraft_uuid=minecraft_uuid
            )
            
            # Обновляем кеш
            self._update_user_cache(user.id, {
                "role": new_role, 
                "has_access": True,
                "discord_roles": member_info.get("roles", []),
                "minecraft_username": minecraft_username
            })
            
            # Если пользователь был деактивирован, но теперь у него есть роль, активируем его
            if not user.is_active and new_role and new_role != "none":
                logger.info(f"Reactivating user {user.discord_username} due to role restoration")
                user_crud.activate_user(db, user=user)

            # Логируем изменения
            if old_role != new_role:
                ActionLogger.log_action(
                    db=db,
                    user=user,
                    action="ROLE_CHANGED",
                    entity_type="user",
                    entity_id=user.id,
                    details={
                        "old_role": old_role,
                        "new_role": new_role,
                        "changed_by": "role_checker_service"
                    }
                )
                
                # Отправляем уведомление о изменении роли
                try:
                    from app.api.v1.events import notify_role_change
                    await notify_role_change(
                        user_id=user.id,
                        old_role=old_role,
                        new_role=new_role,
                        user_data={
                            "discord_username": user.discord_username,
                            "minecraft_username": minecraft_username,
                            "is_active": user.is_active
                        }
                    )
                except Exception as e:
                    logger.error(f"Failed to send role change notification: {e}")

            if minecraft_data_updated:
                ActionLogger.log_action(
                    db=db,
                    user=user,
                    action="MINECRAFT_DATA_UPDATED",
                    entity_type="user",
                    entity_id=user.id,
                    details={
                        "minecraft_username": minecraft_username,
                        "minecraft_uuid": minecraft_uuid,
                        "updated_by": "role_checker_service"
                    }
                )

            return {
                "user_id": user.id,
                "old_role": old_role,
                "new_role": new_role,
                "changed": old_role != new_role,
                "has_access": True,
                "minecraft_data_updated": minecraft_data_updated
            }

        except Exception as e:
            logger.error(f"Error checking roles for user {user.discord_username}: {e}")
            return None
    
    def _is_user_cache_valid(self, user_id: int) -> bool:
        """
        Проверяет, действителен ли кеш для пользователя
        """
        if user_id not in self.user_cache_expiry:
            return False
        
        expiry_time = self.user_cache_expiry[user_id]
        return datetime.now(timezone.utc) < expiry_time
    
    def _update_user_cache(self, user_id: int, data: Dict[str, Any]):
        """
        Обновляет кеш пользователя
        """
        self.user_roles_cache[user_id] = data
        # Кеш действует 2 минуты
        self.user_cache_expiry[user_id] = datetime.now(timezone.utc) + timedelta(minutes=2)
    
    def _clear_expired_cache(self):
        """
        Очищает устаревшие записи из кеша
        """
        now = datetime.now(timezone.utc)
        expired_users = [user_id for user_id, expiry in self.user_cache_expiry.items() if expiry <= now]
        
        for user_id in expired_users:
            self.user_roles_cache.pop(user_id, None)
            self.user_cache_expiry.pop(user_id, None)

    async def get_guild_roles(self) -> List[Dict[str, Any]]:
        """
        Получение ролей гильдии с кешированием

        Returns:
            Список ролей гильдии
        """
        # Проверяем кеш (кешируем на 5 минут)
        if (self.guild_roles_cache and
                self.cache_updated_at and
                self.cache_updated_at > datetime.now(timezone.utc) - timedelta(minutes=5)):
            return self.guild_roles_cache

        # Здесь нужен токен бота для получения ролей
        # Для упрощения примера используем захардкоженные роли
        # В реальном приложении нужно использовать bot token

        # Создаем фиктивные роли для демонстрации
        fake_roles = [
            {"id": "123456789", "name": settings.DISCORD_ADMIN_ROLE_NAME},
            {"id": "987654321", "name": settings.DISCORD_POLICE_ROLE_NAME}
        ]

        self.guild_roles_cache = fake_roles
        self.cache_updated_at = datetime.now(timezone.utc)

        return fake_roles

    def determine_user_role(self, member_data: Dict[str, Any], guild_roles: List[Dict[str, Any]] = None, user: User = None, db: Session = None) -> Optional[str]:
        """
        Определение роли пользователя на основе ролей Discord

        Args:
            member_data: Данные участника сервера
            guild_roles: Список ролей сервера (опционально)
            user: Пользователь для проверки паспорта (опционально)
            db: Сессия базы данных (опционально)

        Returns:
            Роль пользователя ('admin', 'police', 'citizen') или None, если нет доступа
        """
        user_role_ids = member_data.get("roles", [])

        # Проверяем по ID ролей (более надежно)
        if settings.DISCORD_ADMIN_ROLE_ID in user_role_ids:
            return "admin"

        if settings.DISCORD_POLICE_ROLE_ID in user_role_ids:
            return "police"

        # Дополнительная проверка по именам (резервный способ)
        if guild_roles:
            # Создаем словарь для быстрого поиска ролей по ID
            roles_dict = {role["id"]: role["name"] for role in guild_roles}

            # Получаем имена ролей пользователя
            user_role_names = [roles_dict.get(role_id, "") for role_id in user_role_ids]

            # Проверяем наличие админской роли по имени
            if settings.DISCORD_ADMIN_ROLE_NAME in user_role_names:
                return "admin"

            # Проверяем наличие полицейской роли по имени
            if settings.DISCORD_POLICE_ROLE_NAME in user_role_names:
                return "police"

        # Если нет admin/police ролей, назначаем роль citizen
        logger.info(f"User has no admin/police roles, assigning citizen role. User roles: {user_role_ids}")
        return "citizen"

    async def check_user_by_id(self, user_id: int, force: bool = False) -> Optional[Dict[str, Any]]:
        """
        Проверка конкретного пользователя по ID

        Args:
            user_id: ID пользователя
            force: Принудительная проверка, игнорируя кеш

        Returns:
            Результат проверки
        """
        # Очищаем устаревшие записи
        self._clear_expired_cache()
        
        # Проверяем кеш только если не принудительная проверка
        if not force and self._is_user_cache_valid(user_id):
            cached_data = self.user_roles_cache[user_id]
            logger.info(f"Using cached role data for user ID {user_id}")
            return {
                "user_id": user_id,
                "old_role": cached_data.get("role"),
                "new_role": cached_data.get("role"),
                "changed": False,
                "has_access": cached_data.get("has_access", True),
                "minecraft_data_updated": False
            }
        
        # Если принудительная проверка, сбрасываем кеш для этого пользователя
        if force and user_id in self.user_roles_cache:
            logger.info(f"Forcing role check for user ID {user_id}, clearing cache")
            del self.user_roles_cache[user_id]
            if user_id in self.user_cache_expiry:
                del self.user_cache_expiry[user_id]
        
        db = SessionLocal()
        try:
            user = user_crud.get(db, id=user_id)
            if not user:
                return None

            return await self.check_user_roles(db, user)
        finally:
            db.close()


# Глобальный экземпляр сервиса
role_checker_service = RoleCheckerService()