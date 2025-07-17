import asyncio
import json
from typing import AsyncGenerator, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, get_current_user_by_token
from app.models.user import User
from app.services.role_checker import role_checker_service

router = APIRouter()

# Глобальный словарь для хранения подключенных клиентов
connected_clients = {}


class SSEConnection:
    def __init__(self, user_id: int):
        self.user_id = user_id
        self.queue = asyncio.Queue()
        self.connected = True

    async def send_data(self, data: dict):
        """Отправляет данные в SSE поток"""
        if self.connected:
            await self.queue.put(data)

    async def disconnect(self):
        """Отключает SSE соединение"""
        self.connected = False
        await self.queue.put(None)  # Сигнал для завершения генератора


async def send_role_update_to_user(user_id: int, role_data: dict):
    """Отправляет обновление роли конкретному пользователю"""
    if user_id in connected_clients:
        connection = connected_clients[user_id]
        await connection.send_data({
            "event": "role_update",
            "data": role_data
        })


async def send_role_update_to_all_admins(role_data: dict):
    """Отправляет обновление роли всем администраторам"""
    admin_connections = {
        user_id: conn for user_id, conn in connected_clients.items()
        if conn.user_id in [user_id for user_id, conn in connected_clients.items()]
    }
    
    for connection in admin_connections.values():
        await connection.send_data({
            "event": "role_update",
            "data": role_data
        })


async def event_generator(connection: SSEConnection) -> AsyncGenerator[str, None]:
    """Генератор SSE событий"""
    try:
        # Отправляем подтверждение подключения
        yield f"data: {json.dumps({'event': 'connected', 'data': {'message': 'Connected to role updates'}})}\n\n"
        
        while connection.connected:
            try:
                # Ждем данные с таймаутом для heartbeat
                data = await asyncio.wait_for(connection.queue.get(), timeout=30.0)
                
                if data is None:  # Сигнал отключения
                    break
                    
                yield f"data: {json.dumps(data)}\n\n"
                
            except asyncio.TimeoutError:
                # Отправляем heartbeat каждые 30 секунд
                yield f"data: {json.dumps({'event': 'heartbeat', 'data': {'timestamp': asyncio.get_event_loop().time()}})}\n\n"
                
    except Exception as e:
        yield f"data: {json.dumps({'event': 'error', 'data': {'message': str(e)}})}\n\n"
    finally:
        # Удаляем соединение при отключении
        if connection.user_id in connected_clients:
            del connected_clients[connection.user_id]


@router.get("/role-updates")
async def role_updates_stream(
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    SSE endpoint для получения обновлений ролей в реальном времени
    """
    # Получаем пользователя по токену из query параметров
    current_user = await get_current_user_by_token(token, db)
    
    # Создаем новое соединение
    connection = SSEConnection(current_user.id)
    connected_clients[current_user.id] = connection
    
    # Возвращаем SSE поток
    return StreamingResponse(
        event_generator(connection),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control, Authorization"
        }
    )


@router.get("/role-updates/status")
async def get_sse_status(
    current_user: User = Depends(get_current_user)
):
    """
    Получить статус SSE соединений
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    return {
        "connected_clients": len(connected_clients),
        "client_ids": list(connected_clients.keys())
    }


# Функция для интеграции с role_checker_service
async def notify_role_change(user_id: int, old_role: str, new_role: str, user_data: dict):
    """
    Уведомляет клиентов об изменении роли
    Должна вызываться из role_checker_service
    """
    role_update_data = {
        "user_id": user_id,
        "old_role": old_role,
        "new_role": new_role,
        "timestamp": asyncio.get_event_loop().time(),
        "user_data": user_data
    }
    
    # Отправляем обновление конкретному пользователю
    await send_role_update_to_user(user_id, role_update_data)
    
    # Отправляем обновление всем администраторам
    await send_role_update_to_all_admins(role_update_data)