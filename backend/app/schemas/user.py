from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.user import UserRole


class UserBase(BaseModel):
    """
    Базовая схема пользователя
    """
    discord_username: str = Field(..., description="Discord имя пользователя")
    minecraft_username: Optional[str] = Field(None, description="Minecraft никнейм")
    role: UserRole = Field(default=UserRole.POLICE, description="Роль пользователя")
    is_active: bool = Field(default=True, description="Активен ли пользователь")


class UserCreate(BaseModel):
    """
    Схема для создания пользователя (обычно не используется, так как создание происходит через Discord)
    """
    discord_id: int = Field(..., description="Discord ID")
    discord_username: str = Field(..., description="Discord имя пользователя")
    discord_discriminator: Optional[str] = Field(None, description="Discord дискриминатор")
    discord_avatar: Optional[str] = Field(None, description="Discord аватар")
    minecraft_username: Optional[str] = Field(None, description="Minecraft никнейм")
    minecraft_uuid: Optional[str] = Field(None, description="Minecraft UUID")
    role: UserRole = Field(default=UserRole.POLICE, description="Роль пользователя")


class UserUpdate(BaseModel):
    """
    Схема для обновления пользователя
    """
    discord_username: Optional[str] = Field(None, description="Discord имя пользователя")
    discord_discriminator: Optional[str] = Field(None, description="Discord дискриминатор")
    discord_avatar: Optional[str] = Field(None, description="Discord аватар")
    minecraft_username: Optional[str] = Field(None, description="Minecraft никнейм")
    minecraft_uuid: Optional[str] = Field(None, description="Minecraft UUID")
    role: Optional[UserRole] = Field(None, description="Роль пользователя")
    is_active: Optional[bool] = Field(None, description="Активен ли пользователь")


class User(BaseModel):
    """
    Схема пользователя для ответа
    """
    id: int
    discord_id: int
    discord_username: str
    discord_discriminator: Optional[str]
    discord_avatar: Optional[str]
    minecraft_username: Optional[str]
    minecraft_uuid: Optional[str]
    role: str
    is_active: bool
    last_role_check: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserPublic(BaseModel):
    """
    Публичная схема пользователя (без приватных данных)
    """
    id: int
    discord_username: str
    minecraft_username: Optional[str]
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """
    Схема для входа в систему (не используется, так как вход через Discord)
    """
    discord_id: int = Field(..., description="Discord ID")


class Token(BaseModel):
    """
    Схема JWT токена
    """
    access_token: str
    token_type: str
    expires_in: int
    user: User


class DiscordUserInfo(BaseModel):
    """
    Схема информации о пользователе Discord
    """
    id: str
    username: str
    discriminator: Optional[str]
    avatar: Optional[str]
    verified: Optional[bool]
    email: Optional[str]


class DiscordAuthCallback(BaseModel):
    """
    Схема для callback авторизации Discord
    """
    code: str
    state: Optional[str]


class RoleCheckResult(BaseModel):
    """
    Результат проверки ролей
    """
    user_id: int
    old_role: str
    new_role: str
    changed: bool
    has_access: bool
    minecraft_data_updated: bool

    class Config:
        from_attributes = True


class UserStatistics(BaseModel):
    """
    Статистика пользователей
    """
    total_users: int
    active_users: int
    admin_users: int
    police_users: int