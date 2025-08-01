import httpx
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import urllib.parse
from app.core.config import settings


class DiscordClient:
    """
    Клиент для работы с Discord API
    """

    def __init__(self):
        self.base_url = "https://discord.com/api/v10"
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=30.0,
            headers={
                "User-Agent": "RP-Server-Backend/1.0.0"
            }
        )

    def get_oauth_url(self, state: str = None) -> str:
        """
        Получение URL для OAuth2 авторизации

        Args:
            state: Состояние для защиты от CSRF

        Returns:
            URL для перенаправления на Discord
        """
        params = {
            "client_id": settings.DISCORD_CLIENT_ID,
            "redirect_uri": settings.DISCORD_REDIRECT_URI,
            "response_type": "code",
            "scope": "identify guilds"
        }

        if state:
            params["state"] = state

        return f"https://discord.com/oauth2/authorize?{urllib.parse.urlencode(params)}"

    async def exchange_code(self, code: str) -> Optional[Dict[str, Any]]:
        """
        Обмен кода на токен доступа

        Args:
            code: Код авторизации от Discord

        Returns:
            Данные токена или None в случае ошибки
        """
        try:
            response = await self.client.post(
                "/oauth2/token",
                data={
                    "client_id": settings.DISCORD_CLIENT_ID,
                    "client_secret": settings.DISCORD_CLIENT_SECRET,
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": settings.DISCORD_REDIRECT_URI,
                },
                headers={
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            )

            if response.status_code == 200:
                return response.json()
            else:
                print(f"Discord token exchange error: {response.status_code} - {response.text}")
                return None

        except Exception as e:
            print(f"Discord token exchange failed: {e}")
            return None

    async def refresh_token(self, refresh_token: str) -> Optional[Dict[str, Any]]:
        """
        Обновление токена доступа

        Args:
            refresh_token: Refresh token

        Returns:
            Новые данные токена или None в случае ошибки
        """
        try:
            response = await self.client.post(
                "/oauth2/token",
                data={
                    "client_id": settings.DISCORD_CLIENT_ID,
                    "client_secret": settings.DISCORD_CLIENT_SECRET,
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                },
                headers={
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            )

            if response.status_code == 200:
                return response.json()
            else:
                print(f"Discord token refresh error: {response.status_code} - {response.text}")
                return None

        except Exception as e:
            print(f"Discord token refresh failed: {e}")
            return None

    async def get_user_info(self, access_token: str) -> Optional[Dict[str, Any]]:
        """
        Получение информации о пользователе

        Args:
            access_token: Токен доступа

        Returns:
            Данные пользователя или None в случае ошибки
        """
        try:
            response = await self.client.get(
                "/users/@me",
                headers={
                    "Authorization": f"Bearer {access_token}"
                }
            )

            if response.status_code == 200:
                return response.json()
            else:
                print(f"Discord user info error: {response.status_code} - {response.text}")
                return None

        except Exception as e:
            print(f"Discord user info failed: {e}")
            return None

    async def get_user_guilds(self, access_token: str) -> Optional[List[Dict[str, Any]]]:
        """
        Получение списка серверов пользователя

        Args:
            access_token: Токен доступа

        Returns:
            Список серверов или None в случае ошибки
        """
        try:
            response = await self.client.get(
                "/users/@me/guilds",
                headers={
                    "Authorization": f"Bearer {access_token}"
                }
            )

            if response.status_code == 200:
                return response.json()
            else:
                print(f"Discord guilds error: {response.status_code} - {response.text}")
                return None

        except Exception as e:
            print(f"Discord guilds failed: {e}")
            return None

    async def get_guild_member(self, access_token: str, guild_id: str) -> Optional[Dict[str, Any]]:
        """
        Получение информации о пользователе в конкретном сервере

        Args:
            access_token: Токен доступа
            guild_id: ID сервера

        Returns:
            Данные участника или None в случае ошибки
        """
        try:
            response = await self.client.get(
                f"/users/@me/guilds/{guild_id}/member",
                headers={
                    "Authorization": f"Bearer {access_token}"
                }
            )

            if response.status_code == 200:
                return response.json()
            else:
                print(f"Discord guild member error: {response.status_code} - {response.text}")
                return None

        except Exception as e:
            print(f"Discord guild member failed: {e}")
            return None

    async def get_guild_roles(self, guild_id: str, bot_token: str) -> Optional[List[Dict[str, Any]]]:
        """
        Получение списка ролей сервера (требует токен бота)

        Args:
            guild_id: ID сервера
            bot_token: Токен бота

        Returns:
            Список ролей или None в случае ошибки
        """
        try:
            response = await self.client.get(
                f"/guilds/{guild_id}/roles",
                headers={
                    "Authorization": f"Bot {bot_token}"
                }
            )

            if response.status_code == 200:
                return response.json()
            else:
                print(f"Discord guild roles error: {response.status_code} - {response.text}")
                return None

        except Exception as e:
            print(f"Discord guild roles failed: {e}")
            return None

    async def get_guild_member_by_bot(self, bot_token: str, guild_id: str, user_id: int) -> Optional[Dict[str, Any]]:
        """
        Получение информации о пользователе в сервере через Bot API

        Args:
            bot_token: Токен бота
            guild_id: ID сервера
            user_id: ID пользователя

        Returns:
            Данные участника или None в случае ошибки
        """
        try:
            response = await self.client.get(
                f"/guilds/{guild_id}/members/{user_id}",
                headers={
                    "Authorization": f"Bot {bot_token}"
                }
            )

            if response.status_code == 200:
                return response.json()
            else:
                print(f"Discord guild member (bot) error: {response.status_code} - {response.text}")
                return None

        except Exception as e:
            print(f"Discord guild member (bot) failed: {e}")
            return None

    def determine_user_role(self, member_data: Dict[str, Any], guild_roles: List[Dict[str, Any]] = None) -> Optional[str]:
        """
        Определение роли пользователя на основе ролей Discord
        ВНИМАНИЕ: Этот метод НЕ проверяет паспорта для роли citizen.
        Для полной проверки используйте determine_user_role из role_checker.py

        Args:
            member_data: Данные участника сервера
            guild_roles: Список ролей сервера (опционально)

        Returns:
            Роль пользователя ('admin' или 'police') или None, если нет нужных ролей Discord
        """
        user_role_ids = member_data.get("roles", [])

        print(f"DEBUG determine_user_role: user_role_ids = {user_role_ids}")
        print(f"DEBUG determine_user_role: admin_role_id = {settings.DISCORD_ADMIN_ROLE_ID}")
        print(f"DEBUG determine_user_role: police_role_id = {settings.DISCORD_POLICE_ROLE_ID}")
        print(f"DEBUG determine_user_role: admin_role_id type = {type(settings.DISCORD_ADMIN_ROLE_ID)}")
        print(f"DEBUG determine_user_role: user_role_ids types = {[type(x) for x in user_role_ids]}")
        
        # Проверяем по ID ролей (более надежно) - приводим к строке для сравнения
        admin_role_id = str(settings.DISCORD_ADMIN_ROLE_ID)
        police_role_id = str(settings.DISCORD_POLICE_ROLE_ID)
        user_role_ids_str = [str(role_id) for role_id in user_role_ids]
        
        print(f"DEBUG determine_user_role: checking {admin_role_id} in {user_role_ids_str}")
        if admin_role_id in user_role_ids_str:
            print(f"DEBUG determine_user_role: Found admin role!")
            return "admin"

        if police_role_id in user_role_ids_str:
            print(f"DEBUG determine_user_role: Found police role!")
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

        # Если нет нужных ролей Discord, возвращаем None
        # ВНИМАНИЕ: Этот метод НЕ проверяет паспорта!
        return None

    async def close(self):
        """
        Закрытие HTTP клиента
        """
        await self.client.aclose()


# Глобальный экземпляр клиента
discord_client = DiscordClient()