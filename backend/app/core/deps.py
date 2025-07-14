from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_token
from app.crud.user import user_crud
from app.models.user import User

# Схема безопасности
security = HTTPBearer()


def get_current_user(
        db: Session = Depends(get_db),
        credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """
    Получение текущего пользователя по JWT токену
    """
    payload = verify_token(credentials.credentials)
    discord_id = payload.get("sub")

    if not discord_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Не удалось подтвердить учетные данные",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        discord_id = int(discord_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный формат Discord ID",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = user_crud.get_by_discord_id(db, discord_id=discord_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Пользователь не найден",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Пользователь заблокирован"
        )

    return user


def get_current_active_admin(
        current_user: User = Depends(get_current_user)
) -> User:
    """
    Проверка прав администратора
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав доступа. Требуются права администратора."
        )
    return current_user


def get_current_police_or_admin(
        current_user: User = Depends(get_current_user)
) -> User:
    """
    Проверка прав полицейского или администратора
    """
    if current_user.role not in ["police", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав доступа. Требуются права полицейского или администратора."
        )
    return current_user


def get_current_user_with_minecraft(
        current_user: User = Depends(get_current_user)
) -> User:
    """
    Проверка, что у пользователя есть привязка к Minecraft
    """
    if not current_user.minecraft_username:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="У вас нет привязки к Minecraft аккаунту на сервере"
        )
    return current_user


def verify_discord_user(
        current_user: User = Depends(get_current_user)
) -> User:
    """
    Проверка, что пользователь прошел Discord авторизацию
    """
    if not current_user.discord_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Требуется авторизация через Discord"
        )
    return current_user