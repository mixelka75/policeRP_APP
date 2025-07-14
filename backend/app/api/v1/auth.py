from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.core.security import create_access_token
from app.core.deps import get_current_user
from app.crud.user import user_crud
from app.schemas.user import Token, UserLogin
from app.models.user import User
from app.utils.logger import ActionLogger

router = APIRouter()


@router.post("/login", response_model=Token)
def login_for_access_token(
        request: Request,
        db: Session = Depends(get_db),
        form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    Авторизация пользователя и получение JWT токена
    """
    user = user_crud.authenticate(
        db, username=form_data.username, password=form_data.password
    )

    if not user:
        # Логируем неудачную попытку входа
        ActionLogger.log_anonymous_security_event(
            db=db,
            event_type="LOGIN_FAILED",
            details={
                "username": form_data.username,
                "reason": "invalid_credentials"
            },
            request=request
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user_crud.is_active(user):
        # Логируем попытку входа заблокированного пользователя
        ActionLogger.log_action(
            db=db,
            user=user,
            action="LOGIN_BLOCKED",
            entity_type="security",
            details={
                "username": user.username,
                "reason": "user_inactive"
            },
            request=request
        )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь заблокирован"
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    # Логируем успешный вход пользователя
    ActionLogger.log_user_login(db=db, user=user, request=request)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/login-json", response_model=Token)
def login_json(
        request: Request,
        user_login: UserLogin,
        db: Session = Depends(get_db)
):
    """
    Авторизация пользователя через JSON (альтернативный метод)
    """
    user = user_crud.authenticate(
        db, username=user_login.username, password=user_login.password
    )

    if not user:
        # Логируем неудачную попытку входа
        ActionLogger.log_anonymous_security_event(
            db=db,
            event_type="LOGIN_FAILED",
            details={
                "username": user_login.username,
                "reason": "invalid_credentials",
                "method": "json"
            },
            request=request
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль",
        )

    if not user_crud.is_active(user):
        # Логируем попытку входа заблокированного пользователя
        ActionLogger.log_action(
            db=db,
            user=user,
            action="LOGIN_BLOCKED",
            entity_type="security",
            details={
                "username": user.username,
                "reason": "user_inactive",
                "method": "json"
            },
            request=request
        )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь заблокирован"
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    # Логируем успешный вход пользователя
    ActionLogger.log_user_login(db=db, user=user, request=request)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/logout")
def logout(
        request: Request,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    """
    Выход из системы (логирование действия)

    Примечание: При использовании JWT токенов, фактический выход происходит на клиенте
    путем удаления токена. Этот эндпоинт служит для логирования события выхода.
    """
    # Логируем выход пользователя
    ActionLogger.log_user_logout(db=db, user=current_user, request=request)

    return {
        "message": "Выход выполнен успешно",
        "username": current_user.username
    }


@router.get("/me")
def get_current_user_info(
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
            "username": current_user.username,
            "role": current_user.role
        },
        request=request
    )

    return {
        "user": current_user,
        "message": "Токен действителен"
    }