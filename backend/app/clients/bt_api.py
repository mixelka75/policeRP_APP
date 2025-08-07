"""
Клиент для работы с API баллов труда
"""
import asyncio
import logging
from typing import Dict, List, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


class BTAPIClient:
    """Клиент для работы с API баллов труда"""
    
    def __init__(self):
        self.base_url = "http://82.117.84.218:5000/api/users"
        self.token = "sdfusdufusdufus3f9g7f73g6fg3"
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    async def get_user_bt(self, user_id: str) -> Optional[int]:
        """Получить количество баллов труда пользователя"""
        try:
            print(f"DEBUG: Requesting BT for user {user_id} from {self.base_url}")  # Отладка
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    self.base_url,
                    headers=self.headers,
                    timeout=10.0
                )
                
                print(f"DEBUG: BT API response status: {response.status_code}")  # Отладка
                
                if response.status_code == 200:
                    users = response.json()
                    print(f"DEBUG: BT API returned {len(users)} users")  # Отладка
                    for user in users:
                        if str(user.get("user_id")) == str(user_id):
                            bt_value = user.get("bt", 0)
                            print(f"DEBUG: Found user {user_id} with BT: {bt_value}")  # Отладка
                            return bt_value
                    print(f"DEBUG: User {user_id} not found in BT API")  # Отладка
                    return None
                else:
                    logger.error(f"BT API error: {response.status_code} - {response.text}")
                    print(f"DEBUG: BT API error: {response.status_code} - {response.text}")  # Отладка
                    return None
                    
        except Exception as e:
            logger.error(f"Error getting BT for user {user_id}: {e}")
            print(f"DEBUG: Exception getting BT for user {user_id}: {e}")  # Отладка
            return None
    
    async def subtract_bt(self, user_id: str, amount: int) -> bool:
        """Списать баллы труда у пользователя"""
        try:
            # Сначала получаем текущий баланс
            current_bt = await self.get_user_bt(user_id)
            if current_bt is None or current_bt < amount:
                return False
            
            # Вычисляем новый баланс
            new_bt = current_bt - amount
            
            # Обновляем баланс
            async with httpx.AsyncClient() as client:
                response = await client.put(
                    f"{self.base_url}/{user_id}",
                    json={"bt": new_bt},
                    headers=self.headers,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result.get("success", False)
                else:
                    logger.error(f"BT API error: {response.status_code} - {response.text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error subtracting BT for user {user_id}: {e}")
            return False
    
    async def add_bt(self, user_id: str, amount: int) -> bool:
        """Добавить баллы труда пользователю"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/{user_id}/add",
                    json={"bt": amount},
                    headers=self.headers,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result.get("success", False)
                else:
                    logger.error(f"BT API error: {response.status_code} - {response.text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error adding BT for user {user_id}: {e}")
            return False
    
    async def create_user(self, user_id: str, initial_bt: int = 0) -> bool:
        """Создать пользователя в системе баллов труда"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.base_url,
                    json={"user_id": user_id, "bt": initial_bt},
                    headers=self.headers,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result.get("success", False)
                else:
                    logger.error(f"BT API error: {response.status_code} - {response.text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error creating BT user {user_id}: {e}")
            return False


# Глобальный экземпляр клиента
bt_client = BTAPIClient()