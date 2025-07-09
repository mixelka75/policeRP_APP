from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.core.security import create_access_token
from app.crud.user import user_crud
from app.schemas.user import Token, UserLogin
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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user_crud.is_active(user):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь заблокирован"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    # Логируем вход пользователя
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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль",
        )
    
    if not user_crud.is_active(user):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь заблокирован"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    # Логируем вход пользователя
    ActionLogger.log_user_login(db=db, user=user, request=request)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }