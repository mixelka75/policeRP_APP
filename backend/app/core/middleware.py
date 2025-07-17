import asyncio
import logging
from typing import Callable, Optional
from fastapi import Request, Response, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.database import SessionLocal
from app.core.deps import get_current_user_by_token
from app.services.role_checker import role_checker_service

logger = logging.getLogger(__name__)

class RoleCheckMiddleware(BaseHTTPMiddleware):
    """
    Middleware для автоматической проверки ролей при выполнении определенных действий
    """
    
    # Эндпоинты, которые требуют проверки ролей
    ROLE_CHECK_ENDPOINTS = {
        # Логи
        'GET:/api/v1/logs': 'view_logs',
        'GET:/api/v1/logs/security': 'view_security_logs',
        
        # Пользователи
        'GET:/api/v1/users': 'view_users',
        'GET:/api/v1/users/search': 'search_users',
        'POST:/api/v1/users': 'create_user',
        'PUT:/api/v1/users': 'update_user',
        'DELETE:/api/v1/users': 'delete_user',
        
        # Паспорта
        'GET:/api/v1/passports': 'view_passports',
        'POST:/api/v1/passports': 'create_passport',
        'PUT:/api/v1/passports': 'update_passport',
        'DELETE:/api/v1/passports': 'delete_passport',
        'POST:/api/v1/passports/emergency': 'update_passport_emergency',
        
        # Штрафы
        'GET:/api/v1/fines': 'view_fines',
        'POST:/api/v1/fines': 'create_fine',
        'PUT:/api/v1/fines': 'update_fine',
        'DELETE:/api/v1/fines': 'delete_fine',
    }

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Обработка HTTP запроса с проверкой ролей
        """
        # Получаем метод и путь
        method = request.method
        path = request.url.path
        
        # Проверяем, нужно ли проверять роли для данного эндпоинта
        endpoint_key = f"{method}:{path}"
        if endpoint_key not in self.ROLE_CHECK_ENDPOINTS:
            # Если эндпоинт не требует проверки ролей, пропускаем
            return await call_next(request)
        
        # Получаем токен из заголовка Authorization
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            # Если нет токена, пропускаем (авторизация обрабатывается в эндпоинте)
            return await call_next(request)
        
        token = auth_header.split(" ")[1]
        
        try:
            # Получаем пользователя по токену
            with SessionLocal() as db:
                user = await get_current_user_by_token(token, db)
                
                if user:
                    # Запускаем проверку ролей для этого пользователя в фоне
                    asyncio.create_task(self._check_user_roles(user.id))
                    
                    # Логируем действие
                    action = self.ROLE_CHECK_ENDPOINTS[endpoint_key]
                    logger.info(f"User {user.discord_username} performed action: {action}")
                    
        except Exception as e:
            # Если произошла ошибка при проверке токена, не прерываем запрос
            logger.error(f"Error in role check middleware: {e}")
        
        # Продолжаем обработку запроса
        return await call_next(request)
    
    async def _check_user_roles(self, user_id: int):
        """
        Асинхронная проверка ролей для конкретного пользователя
        """
        try:
            result = await role_checker_service.check_user_by_id(user_id)
            if result:
                if result.get("changed"):
                    logger.info(f"User {user_id} role changed during action: {result}")
                
                if not result.get("has_access"):
                    logger.warning(f"User {user_id} lost access during action")
                    
        except Exception as e:
            logger.error(f"Error checking roles for user {user_id}: {e}")


def get_user_token_from_request(request: Request) -> Optional[str]:
    """
    Извлекает токен из запроса
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    
    return auth_header.split(" ")[1]


async def trigger_role_check_for_user(user_id: int, action: str):
    """
    Запускает проверку ролей для пользователя при выполнении действия
    """
    logger.info(f"Triggering role check for user {user_id} due to action: {action}")
    
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