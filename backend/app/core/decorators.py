import asyncio
import logging
from functools import wraps
from typing import Callable, Any
from datetime import datetime, timedelta, timezone
from fastapi import Request, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.services.role_checker import role_checker_service

logger = logging.getLogger(__name__)

# Семафор для ограничения одновременных проверок ролей
role_check_semaphore = asyncio.Semaphore(2)  # Максимум 2 одновременных проверки

# Кеш последних проверок пользователей
last_role_check: dict[int, datetime] = {}
ROLE_CHECK_COOLDOWN = timedelta(minutes=1)  # Кулдаун 1 минута


def check_user_roles_on_action(action_name: str):
    """
    Декоратор для автоматической проверки ролей пользователя при выполнении действия
    
    Args:
        action_name: Название действия для логирования
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Ищем пользователя в аргументах функции
            current_user = None
            
            # Проверяем позиционные аргументы
            for arg in args:
                if isinstance(arg, User):
                    current_user = arg
                    break
            
            # Проверяем именованные аргументы
            if not current_user:
                for key, value in kwargs.items():
                    if isinstance(value, User) and 'user' in key.lower():
                        current_user = value
                        break
            
            # Если пользователь найден, запускаем проверку ролей в фоне
            if current_user:
                logger.info(f"User {current_user.discord_username} performing action: {action_name}")
                
                # Запускаем проверку ролей асинхронно
                asyncio.create_task(
                    trigger_role_check_for_user(current_user.id, action_name)
                )
            
            # Выполняем оригинальную функцию
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


async def trigger_role_check_for_user(user_id: int, action: str):
    """
    Запускает проверку ролей для пользователя при выполнении действия
    """
    now = datetime.now(timezone.utc)
    
    # Проверяем кулдаун
    if user_id in last_role_check:
        time_since_last_check = now - last_role_check[user_id]
        if time_since_last_check < ROLE_CHECK_COOLDOWN:
            logger.debug(f"Role check for user {user_id} skipped due to cooldown ({time_since_last_check.total_seconds():.1f}s since last check)")
            return None
    
    logger.info(f"Triggering role check for user {user_id} due to action: {action}")
    last_role_check[user_id] = now
    
    async with role_check_semaphore:  # Ограничиваем количество одновременных проверок
        try:
            result = await role_checker_service.check_user_by_id(user_id)
            if result:
                if result.get("changed"):
                    logger.info(f"User {user_id} role changed during {action}: {result}")
                
                if not result.get("has_access"):
                    logger.warning(f"User {user_id} lost access during {action}")
                    
                return result
                    
        except Exception as e:
            logger.error(f"Error checking roles for user {user_id} during {action}: {e}")
            return None


def with_role_check(action_name: str):
    """
    Упрощенный декоратор для эндпоинтов FastAPI
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Ищем current_user в kwargs
            current_user = kwargs.get('current_user')
            
            if current_user and isinstance(current_user, User):
                # Запускаем проверку ролей в фоне
                asyncio.create_task(
                    trigger_role_check_for_user(current_user.id, action_name)
                )
            
            # Выполняем оригинальную функцию
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator