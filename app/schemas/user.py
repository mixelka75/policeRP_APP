from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.user import UserRole


class UserBase(BaseModel):
    """
    Базовая схема пользователя
    """
    username: str = Field(..., min_length=3, max_length=50, description="Имя пользователя")
    role: UserRole = Field(default=UserRole.POLICE, description="Роль пользователя")
    is_active: bool = Field(default=True, description="Активен ли пользователь")


class UserCreate(UserBase):
    """
    Схема для создания пользователя
    """
    password: str = Field(..., min_length=6, max_length=100, description="Пароль")


class UserUpdate(BaseModel):
    """
    Схема для обновления пользователя
    """
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    password: Optional[str] = Field(None, min_length=6, max_length=100)
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class User(UserBase):
    """
    Схема пользователя для ответа
    """
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """
    Схема для входа в систему
    """
    username: str = Field(..., description="Имя пользователя")
    password: str = Field(..., description="Пароль")


class Token(BaseModel):
    """
    Схема JWT токена
    """
    access_token: str
    token_type: str
    user: User