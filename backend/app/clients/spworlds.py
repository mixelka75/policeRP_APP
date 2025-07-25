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
            timeout=10.0,  # Reduced timeout for faster failure detection
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
            response = await self.client.get(f"/api/public/users/{discord_id}")

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

        except httpx.TimeoutException:
            print(f"SP-Worlds API timeout for Discord ID {discord_id}")
            return None
        except httpx.ConnectError:
            print(f"SP-Worlds API connection error for Discord ID {discord_id}")
            return None
        except Exception as e:
            print(f"SP-Worlds API request failed for Discord ID {discord_id}: {e}")
            return None

    async def get_player_skin_url(self, uuid: str) -> Optional[str]:
        """
        Получение URL скина (головы) игрока по UUID

        Args:
            uuid: Minecraft UUID игрока

        Returns:
            URL скина или None если не удалось получить
        """
        if not uuid:
            return None
        
        try:
            skin_client = httpx.AsyncClient(timeout=10.0)
            skin_url = f"http://assets.zaralx.ru/docs/minecraft/player/face/{uuid}"
            
            response = await skin_client.head(skin_url)
            await skin_client.aclose()
            
            if response.status_code == 200:
                return skin_url
            else:
                print(f"Skin URL not available for UUID {uuid}: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"Failed to check skin URL for UUID {uuid}: {e}")
            return None

    async def ping(self) -> bool:
        """
        Проверка доступности API

        Returns:
            True если API доступен
        """
        try:
            # SP-Worlds API doesn't have a ping endpoint, so we'll test with a simple user lookup
            # Using a non-existent Discord ID should return 404, which means API is working
            response = await self.client.get("/users/1", timeout=5.0)
            return response.status_code in [200, 404, 401]  # 401 означает что API работает, но нужна авторизация
        except httpx.TimeoutException:
            print("SP-Worlds API ping timeout")
            return False
        except httpx.ConnectError:
            print("SP-Worlds API connection error during ping")
            return False
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