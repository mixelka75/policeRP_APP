from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import secrets
import uuid
from typing import Optional

from app.core.database import get_db
from app.core.config import settings
from app.core.security import create_access_token
from app.core.deps import get_current_user
from app.crud.user import user_crud
from app.schemas.user import Token, DiscordAuthCallback, User as UserSchema
from app.models.user import User
from app.clients.discord import discord_client
from app.clients.spworlds import spworlds_client
from app.utils.logger import ActionLogger

router = APIRouter()


@router.get("/discord/login")
async def discord_login(request: Request):
    """
    Инициация авторизации через Discord
    """
    # Генерируем state для защиты от CSRF
    state = secrets.token_urlsafe(32)

    # Сохраняем state в сессии (в реальном приложении лучше использовать Redis)
    # Для простоты будем передавать state в URL

    oauth_url = discord_client.get_oauth_url(state=state)

    return {
        "oauth_url": oauth_url,
        "state": state
    }


@router.get("/discord/callback")
async def discord_callback(
        request: Request,
        response: Response,
        code: str,
        state: Optional[str] = None,
        db: Session = Depends(get_db)
):
    """
    Callback для Discord OAuth2
    """
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Код авторизации не получен"
        )

    try:
        # Обмениваем код на токен
        token_data = await discord_client.exchange_code(code)
        if not token_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Не удалось получить токен Discord"
            )

        access_token = token_data["access_token"]
        refresh_token = token_data["refresh_token"]
        expires_in = token_data["expires_in"]

        # Получаем информацию о пользователе
        user_info = await discord_client.get_user_info(access_token)
        if not user_info:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Не удалось получить информацию о пользователе Discord"
            )

        discord_id = int(user_info["id"])
        discord_username = user_info["username"]
        discord_discriminator = user_info.get("discriminator")
        discord_avatar = user_info.get("avatar")

        # Проверяем, что пользователь состоит в нужном сервере
        guilds = await discord_client.get_user_guilds(access_token)
        if not guilds:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Не удалось получить список серверов"
            )

        # Проверяем наличие в нужном сервере
        target_guild = None
        for guild in guilds:
            if guild["id"] == settings.DISCORD_GUILD_ID:
                target_guild = guild
                break

        if not target_guild:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Вы не состоите в требуемом Discord сервере"
            )

        # Получаем информацию о пользователе на сервере
        member_info = await discord_client.get_guild_member(access_token, settings.DISCORD_GUILD_ID)
        if not member_info:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Не удалось получить информацию о участии в сервере"
            )

        # Получаем роли сервера (здесь нужен токен бота для полной информации)
        # Для простоты определяем роль по именам ролей пользователя
        user_roles = member_info.get("roles", [])

        # Определяем роль пользователя (упрощенная версия)
        user_role = "police"  # По умолчанию

        # Проверяем наличие ролей по именам (требует дополнительной настройки)
        # В реальном приложении нужно сохранить ID ролей в настройках

        # Получаем данные из SP-Worlds API
        spworlds_data = await spworlds_client.find_user(str(discord_id))
        minecraft_username = spworlds_data.get("username") if spworlds_data else None
        minecraft_uuid = spworlds_data.get("uuid") if spworlds_data else None

        # Проверяем, есть ли пользователь в базе
        user = user_crud.get_by_discord_id(db, discord_id=discord_id)

        expires_at = datetime.utcnow() + timedelta(seconds=expires_in)

        if user:
            # Обновляем существующего пользователя
            user = user_crud.update_discord_data(
                db,
                user=user,
                discord_username=discord_username,
                discord_discriminator=discord_discriminator,
                discord_avatar=discord_avatar,
                minecraft_username=minecraft_username,
                minecraft_uuid=minecraft_uuid,
                role=user_role,
                discord_roles=user_roles,
                discord_access_token=access_token,
                discord_refresh_token=refresh_token,
                discord_expires_at=expires_at
            )
        else:
            # Создаем нового пользователя
            user = user_crud.create_from_discord(
                db,
                discord_id=discord_id,
                discord_username=discord_username,
                discord_discriminator=discord_discriminator,
                discord_avatar=discord_avatar,
                minecraft_username=minecraft_username,
                minecraft_uuid=minecraft_uuid,
                role=user_role,
                discord_roles=user_roles,
                discord_access_token=access_token,
                discord_refresh_token=refresh_token,
                discord_expires_at=expires_at
            )

        # Логируем успешный вход
        ActionLogger.log_user_login(db=db, user=user, request=request)

        # Создаем JWT токен для нашего приложения
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        app_access_token = create_access_token(
            data={"sub": str(user.discord_id)},
            expires_delta=access_token_expires
        )

        # Перенаправляем на фронтенд с токеном
        redirect_url = f"{settings.FRONTEND_URL}/auth/callback?token={app_access_token}"
        return RedirectResponse(url=redirect_url)

    except Exception as e:
        # Логируем ошибку
        ActionLogger.log_anonymous_security_event(
            db=db,
            event_type="LOGIN_ERROR",
            details={
                "error": str(e),
                "discord_id": discord_id if 'discord_id' in locals() else None
            },
            request=request
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка авторизации: {str(e)}"
        )


@router.post("/logout")
async def logout(
        request: Request,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    """
    Выход из системы
    """
    # Логируем выход пользователя
    ActionLogger.log_user_logout(db=db, user=current_user, request=request)

    # Очищаем Discord токены (опционально)
    user_crud.update_discord_data(
        db,
        user=current_user,
        discord_access_token=None,
        discord_refresh_token=None,
        discord_expires_at=None
    )

    return {
        "message": "Выход выполнен успешно",
        "discord_username": current_user.discord_username
    }


@router.get("/me")
async def get_current_user_info(
        request: Request,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    """
    Получить информацию о текущем авторизованном пользователе
    """
    # Логируем проверку токена
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="TOKEN_CHECK",
        entity_type="security",
        entity_id=current_user.id,
        details={
            "discord_username": current_user.discord_username,
            "minecraft_username": current_user.minecraft_username,
            "role": current_user.role
        },
        request=request
    )

    return {
        "user": current_user,
        "message": "Токен действителен"
    }


@router.post("/refresh")
async def refresh_user_data(
        request: Request,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    """
    Обновить данные пользователя из Discord и SP-Worlds
    """
    try:
        # Проверяем, не истек ли Discord токен
        if current_user.discord_expires_at and current_user.discord_expires_at < datetime.utcnow():
            if current_user.discord_refresh_token:
                # Обновляем токен
                token_data = await discord_client.refresh_token(current_user.discord_refresh_token)
                if token_data:
                    access_token = token_data["access_token"]
                    refresh_token = token_data["refresh_token"]
                    expires_in = token_data["expires_in"]
                    expires_at = datetime.utcnow() + timedelta(seconds=expires_in)

                    user_crud.update_discord_data(
                        db,
                        user=current_user,
                        discord_access_token=access_token,
                        discord_refresh_token=refresh_token,
                        discord_expires_at=expires_at
                    )
                    current_user.discord_access_token = access_token
                else:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Не удалось обновить Discord токен"
                    )
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Discord токен истек, требуется повторная авторизация"
                )

        # Получаем обновленные данные из SP-Worlds
        spworlds_data = await spworlds_client.find_user(str(current_user.discord_id))
        minecraft_username = spworlds_data.get("username") if spworlds_data else None
        minecraft_uuid = spworlds_data.get("uuid") if spworlds_data else None

        # Получаем обновленную информацию о ролях
        member_info = await discord_client.get_guild_member(
            current_user.discord_access_token,
            settings.DISCORD_GUILD_ID
        )

        if member_info:
            user_roles = member_info.get("roles", [])
            # Здесь нужно добавить логику определения роли на основе Discord ролей
            # user_role = discord_client.determine_user_role(member_info, guild_roles)
            user_role = current_user.role  # Пока оставляем текущую роль
        else:
            user_roles = current_user.discord_roles
            user_role = current_user.role

        # Обновляем данные пользователя
        updated_user = user_crud.update_discord_data(
            db,
            user=current_user,
            minecraft_username=minecraft_username,
            minecraft_uuid=minecraft_uuid,
            role=user_role,
            discord_roles=user_roles
        )

        # Логируем обновление данных
        ActionLogger.log_action(
            db=db,
            user=current_user,
            action="DATA_REFRESH",
            entity_type="user",
            entity_id=current_user.id,
            details={
                "minecraft_username": minecraft_username,
                "minecraft_uuid": minecraft_uuid,
                "role": user_role
            },
            request=request
        )

        return {
            "user": updated_user,
            "message": "Данные обновлены успешно"
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка обновления данных: {str(e)}"
        )