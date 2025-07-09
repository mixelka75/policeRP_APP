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
    Получение текущего пользователя по токену
    """
    payload = verify_token(credentials.credentials)
    username = payload.get("sub")
    
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Не удалось подтвердить учетные данные",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = user_crud.get_by_username(db, username=username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Пользователь не найден",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неактивный пользователь"
        )
    
    return user


def get_current_active_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Проверка прав администратора
    """
    if current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав доступа"
        )
    return current_user


def get_current_police_or_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Проверка прав полицейского или администратора
    """
    if current_user.role.value not in ["police", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав доступа"
        )
    return current_user