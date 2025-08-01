from datetime import timedelta, datetime, timezone
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
        code: Optional[str] = None,
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

        # Получаем информацию о пользователе на сервере через Bot API
        if settings.DISCORD_BOT_TOKEN:
            # Используем Bot API для получения информации о члене сервера
            try:
                member_info = await discord_client.get_guild_member_by_bot(
                    settings.DISCORD_BOT_TOKEN, 
                    settings.DISCORD_GUILD_ID, 
                    discord_id
                )
                if not member_info:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Вы не состоите в требуемом Discord сервере или бот не имеет доступа"
                    )
                
                user_roles = member_info.get("roles", [])
                print(f"DEBUG: User roles from Discord Bot API: {user_roles}")
                print(f"DEBUG: Admin role ID from settings: {settings.DISCORD_ADMIN_ROLE_ID}")
                print(f"DEBUG: Police role ID from settings: {settings.DISCORD_POLICE_ROLE_ID}")

                # Определяем роль пользователя на основе Discord ролей
                user_role = discord_client.determine_user_role(member_info)
                print(f"DEBUG: Determined user role: {user_role}")
                
                
                # Проверяем, что пользователь имеет нужные роли или паспорт
                if user_role is None:
                    # Проверяем, есть ли у пользователя паспорт
                    from app.crud.passport import passport_crud
                    passport = passport_crud.get_by_discord_id(db, discord_id=str(discord_id))
                    if passport:
                        user_role = "citizen"  # Назначаем роль citizen
                        print(f"DEBUG: User {discord_username} has passport, assigned citizen role")
                    else:
                        print(f"DEBUG: User {discord_username} has roles: {user_roles}")
                        print(f"DEBUG: Expected admin role ID: {settings.DISCORD_ADMIN_ROLE_ID}")
                        print(f"DEBUG: Expected police role ID: {settings.DISCORD_POLICE_ROLE_ID}")
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail="У вас нет необходимых ролей для доступа к системе"
                        )
                
            except HTTPException:
                # Пере-поднимаем HTTPException
                raise
            except Exception as e:
                print(f"DEBUG: Bot API error: {e}")
                # Не назначаем роль по умолчанию, блокируем доступ
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Не удалось проверить роли пользователя"
                )
        else:
            print("DEBUG: No bot token configured")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Сервер не настроен для проверки ролей"
            )

        # Получаем данные из SP-Worlds API
        print(f"DEBUG: Fetching SP-Worlds data for Discord ID: {discord_id}")
        spworlds_data = await spworlds_client.find_user(str(discord_id))
        print(f"DEBUG: SP-Worlds response: {spworlds_data}")
        minecraft_username = spworlds_data.get("username") if spworlds_data else None
        minecraft_uuid = spworlds_data.get("uuid") if spworlds_data else None
        print(f"DEBUG: Extracted minecraft_username: {minecraft_username}, minecraft_uuid: {minecraft_uuid}")

        # Проверяем, есть ли пользователь в базе
        user = user_crud.get_by_discord_id(db, discord_id=discord_id)
        print(f"DEBUG: Existing user found: {user.discord_username if user else 'None'}")

        expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

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
            print(f"DEBUG: Updated existing user: {user.discord_username}, role: {user.role}")
        else:
            # Создаем нового пользователя
            print(f"DEBUG: Creating new user with role: {user_role}")
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
            print(f"DEBUG: Created new user: {user.discord_username}, role: {user.role}, active: {user.is_active}")

        # Логируем успешный вход
        ActionLogger.log_user_login(db=db, user=user, request=request)

        # Создаем JWT токен для нашего приложения
        print(f"DEBUG: Creating JWT token for user: {user.discord_username}, role: {user.role}, discord_id: {user.discord_id}")
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        app_access_token = create_access_token(
            data={"sub": str(user.discord_id)},
            expires_delta=access_token_expires
        )
        print(f"DEBUG: JWT token created: {app_access_token[:50]}...")

        # Перенаправляем на фронтенд с токеном
        redirect_url = f"{settings.FRONTEND_URL}/auth/callback?token={app_access_token}"
        return RedirectResponse(url=redirect_url)

    except HTTPException:
        # Пере-поднимаем HTTPException (403 ошибки аутентификации)
        raise
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
    print(f"DEBUG /me endpoint: Called for user {current_user.discord_username if current_user else 'None'}")
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
        "user": UserSchema.model_validate(current_user),
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
        if current_user.discord_expires_at and current_user.discord_expires_at < datetime.now(timezone.utc):
            if current_user.discord_refresh_token:
                # Обновляем токен
                token_data = await discord_client.refresh_token(current_user.discord_refresh_token)
                if token_data:
                    access_token = token_data["access_token"]
                    refresh_token = token_data["refresh_token"]
                    expires_in = token_data["expires_in"]
                    expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

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
        print(f"DEBUG REFRESH: Fetching SP-Worlds data for Discord ID: {current_user.discord_id}")
        spworlds_data = await spworlds_client.find_user(str(current_user.discord_id))
        print(f"DEBUG REFRESH: SP-Worlds response: {spworlds_data}")
        minecraft_username = spworlds_data.get("username") if spworlds_data else None
        minecraft_uuid = spworlds_data.get("uuid") if spworlds_data else None
        print(f"DEBUG REFRESH: Extracted minecraft_username: {minecraft_username}, minecraft_uuid: {minecraft_uuid}")

        # Получаем обновленную информацию о ролях через Bot API
        if settings.DISCORD_BOT_TOKEN:
            try:
                member_info = await discord_client.get_guild_member_by_bot(
                    settings.DISCORD_BOT_TOKEN,
                    settings.DISCORD_GUILD_ID,
                    current_user.discord_id
                )
                
                if member_info:
                    user_roles = member_info.get("roles", [])
                    # Определяем роль на основе Discord ролей
                    user_role = discord_client.determine_user_role(member_info)
                    
                    # Если роль None, проверяем паспорт
                    if user_role is None:
                        from app.crud.passport import passport_crud
                        passport = passport_crud.get_by_discord_id(db, discord_id=str(current_user.discord_id))
                        if passport:
                            user_role = "citizen"
                        else:
                            raise HTTPException(
                                status_code=status.HTTP_403_FORBIDDEN,
                                detail="У вас больше нет необходимых ролей для доступа к системе"
                            )
                else:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Вы больше не состоите в требуемом Discord сервере"
                    )
            except HTTPException:
                raise
            except Exception as e:
                print(f"DEBUG: Bot API error during refresh: {e}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Не удалось проверить ваши роли"
                )
        else:
            # Fallback через обычный OAuth токен (менее надежно)
            member_info = await discord_client.get_guild_member(
                current_user.discord_access_token,
                settings.DISCORD_GUILD_ID
            )

            if member_info:
                user_roles = member_info.get("roles", [])
                user_role = discord_client.determine_user_role(member_info)
                
                if user_role is None:
                    from app.crud.passport import passport_crud
                    passport = passport_crud.get_by_discord_id(db, discord_id=str(current_user.discord_id))
                    if passport:
                        user_role = "citizen"
                    else:
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail="У вас больше нет необходимых ролей для доступа к системе"
                        )
            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Вы больше не состоите в требуемом Discord сервере"
                )

        # Проверяем, изменилась ли роль
        role_changed = current_user.role != user_role
        old_role = current_user.role

        # Обновляем данные пользователя
        updated_user = user_crud.update_discord_data(
            db,
            user=current_user,
            minecraft_username=minecraft_username,
            minecraft_uuid=minecraft_uuid,
            role=user_role,
            discord_roles=user_roles
        )

        # Логируем изменение роли отдельно
        if role_changed:
            ActionLogger.log_action(
                db=db,
                user=current_user,
                action="ROLE_CHANGED",
                entity_type="user",
                entity_id=current_user.id,
                details={
                    "old_role": old_role,
                    "new_role": user_role,
                    "changed_by": "manual_refresh"
                },
                request=request
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
                "role": user_role,
                "role_changed": role_changed
            },
            request=request
        )

        return {
            "user": UserSchema.model_validate(updated_user),
            "message": "Данные обновлены успешно"
        }

    except HTTPException:
        # Пере-поднимаем HTTPException как есть
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка обновления данных: {str(e)}"
        )


@router.post("/refresh-token")
async def refresh_token(
        request: Request,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    """
    Обновить JWT токен без полной повторной авторизации
    """
    try:
        # Проверяем активность пользователя
        if not current_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Аккаунт деактивирован"
            )

        # Создаем новый JWT токен
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        new_access_token = create_access_token(
            data={"sub": str(current_user.discord_id)},
            expires_delta=access_token_expires
        )

        # Логируем обновление токена
        ActionLogger.log_action(
            db=db,
            user=current_user,
            action="TOKEN_REFRESH",
            entity_type="security",
            entity_id=current_user.id,
            details={
                "discord_username": current_user.discord_username,
                "role": current_user.role
            },
            request=request
        )

        return {
            "access_token": new_access_token,
            "token_type": "bearer",
            "user": UserSchema.model_validate(current_user),
            "message": "Токен обновлен успешно"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка обновления токена: {str(e)}"
        )