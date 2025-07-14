import httpx
from typing import Optional, Dict, Any
import asyncio
from app.core.config import settings


class SPWorldsClient:
    """
    Клиент для работы с SP-Worlds API
    """

    def __init__(self):
        self.base_url = settings.SPWORLDS_API_URL
        self.map_id = settings.SPWORLDS_MAP_ID
        self.map_token = settings.SPWORLDS_MAP_TOKEN
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=30.0,
            headers={
                "User-Agent": "RP-Server-Backend/1.0.0"
            }
        )

    async def find_user(self, discord_id: str) -> Optional[Dict[str, Any]]:
        """
        Поиск пользователя по Discord ID

        Args:
            discord_id: Discord ID пользователя

        Returns:
            Dict с данными пользователя или None если не найден
            {
                "username": "nickname",
                "uuid": "minecraft-uuid"
            }
        """
        try:
            response = await self.client.get(
                f"/maps/{self.map_id}/users/{discord_id}",
                headers={
                    "Authorization": f"Bearer {self.map_token}"
                }
            )

            if response.status_code == 200:
                data = response.json()
                return {
                    "username": data.get("username"),
                    "uuid": data.get("uuid")
                }
            elif response.status_code == 404:
                return None
            else:
                print(f"SP-Worlds API error: {response.status_code} - {response.text}")
                return None

        except Exception as e:
            print(f"SP-Worlds API request failed: {e}")
            return None

    async def ping(self) -> bool:
        """
        Проверка доступности API

        Returns:
            True если API доступен
        """
        try:
            response = await self.client.get("/ping")
            return response.status_code == 200
        except Exception as e:
            print(f"SP-Worlds ping failed: {e}")
            return False

    async def close(self):
        """
        Закрытие HTTP клиента
        """
        await self.client.aclose()


# Глобальный экземпляр клиента
spworlds_client = SPWorldsClient()