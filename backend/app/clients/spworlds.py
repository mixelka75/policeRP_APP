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
            },
            auth=(self.map_id, self.map_token) if self.map_id and self.map_token else None
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
        if not self.map_id or not self.map_token:
            print("SP-Worlds API: map_id or map_token not configured")
            return None
            
        try:
            # Basic authentication уже настроена в клиенте
            response = await self.client.get(f"/users/{discord_id}")

            if response.status_code == 200:
                data = response.json()
                # SP-Worlds API returns 200 with null values if user not found
                if data.get("username") is None and data.get("uuid") is None:
                    print(f"SP-Worlds API: User with Discord ID {discord_id} not found")
                    return None
                return {
                    "username": data.get("username"),
                    "uuid": data.get("uuid")
                }
            elif response.status_code == 401:
                print(f"SP-Worlds API: Authentication failed - check map_id and map_token")
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

    async def find_user_by_nickname(self, nickname: str) -> Optional[Dict[str, Any]]:
        """
        Поиск пользователя по Minecraft nickname (через UUID lookup)
        
        Args:
            nickname: Minecraft nickname пользователя
            
        Returns:
            Dict с данными пользователя или None если не найден
            {
                "username": "nickname",
                "uuid": "minecraft-uuid"
            }
        """
        if not nickname:
            return None
            
        try:
            # Получаем UUID из Mojang API
            mojang_response = await httpx.AsyncClient().get(
                f"https://api.mojang.com/users/profiles/minecraft/{nickname}",
                timeout=5.0
            )
            
            if mojang_response.status_code != 200:
                print(f"Minecraft user {nickname} not found in Mojang API")
                return None
                
            mojang_data = mojang_response.json()
            uuid = mojang_data.get("id")
            
            if not uuid:
                return None
                
            return {
                "username": nickname,
                "uuid": uuid
            }
            
        except Exception as e:
            print(f"Failed to lookup UUID for nickname {nickname}: {e}")
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
            skin_url = f"https://assets.zaralx.ru/api/v1/minecraft/vanilla/player/face/{uuid}/full"
            
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
        if not self.map_id or not self.map_token:
            print("SP-Worlds API: map_id or map_token not configured for ping")
            return False
            
        try:
            # SP-Worlds API doesn't have a ping endpoint, so we'll test with a simple user lookup
            # Using a non-existent Discord ID should return 200 with null data if API is working
            response = await self.client.get("/users/1", timeout=5.0)
            return response.status_code in [200, 404]  # 200 means user found, 404 means user not found but API works
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