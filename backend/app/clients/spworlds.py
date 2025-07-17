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
            # Создаем Authorization header в формате Bearer base64(ID:TOKEN)
            import base64
            auth_string = f"{self.map_id}:{self.map_token}"
            auth_encoded = base64.b64encode(auth_string.encode()).decode()
            
            response = await self.client.get(
                f"/users/{discord_id}",
                headers={
                    "Authorization": f"Bearer {auth_encoded}"
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

        except httpx.TimeoutException:
            print(f"SP-Worlds API timeout for Discord ID {discord_id}")
            return None
        except httpx.ConnectError:
            print(f"SP-Worlds API connection error for Discord ID {discord_id}")
            return None
        except Exception as e:
            print(f"SP-Worlds API request failed for Discord ID {discord_id}: {e}")
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
            return response.status_code in [200, 404]
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