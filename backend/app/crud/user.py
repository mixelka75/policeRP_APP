from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    """
    CRUD операции для пользователей
    """

    def get_by_discord_id(self, db: Session, *, discord_id: int) -> Optional[User]:
        """
        Получить пользователя по Discord ID
        """
        return db.query(User).filter(User.discord_id == discord_id).first()

    def create_from_discord(
            self,
            db: Session,
            *,
            discord_id: int,
            discord_username: str,
            discord_discriminator: Optional[str] = None,
            discord_avatar: Optional[str] = None,
            minecraft_username: Optional[str] = None,
            minecraft_uuid: Optional[str] = None,
            role: str = "police",
            discord_roles: Optional[List[str]] = None,
            discord_access_token: Optional[str] = None,
            discord_refresh_token: Optional[str] = None,
            discord_expires_at: Optional[datetime] = None
    ) -> User:
        """
        Создать пользователя из данных Discord
        """
        db_obj = User(
            discord_id=discord_id,
            discord_username=discord_username,
            discord_discriminator=discord_discriminator,
            discord_avatar=discord_avatar,
            minecraft_username=minecraft_username,
            minecraft_uuid=minecraft_uuid,
            role=role,
            discord_roles=discord_roles or [],
            discord_access_token=discord_access_token,
            discord_refresh_token=discord_refresh_token,
            discord_expires_at=discord_expires_at,
            last_role_check=datetime.utcnow(),
            is_active=True
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_discord_data(
            self,
            db: Session,
            *,
            user: User,
            discord_username: Optional[str] = None,
            discord_discriminator: Optional[str] = None,
            discord_avatar: Optional[str] = None,
            minecraft_username: Optional[str] = None,
            minecraft_uuid: Optional[str] = None,
            role: Optional[str] = None,
            discord_roles: Optional[List[str]] = None,
            discord_access_token: Optional[str] = None,
            discord_refresh_token: Optional[str] = None,
            discord_expires_at: Optional[datetime] = None
    ) -> User:
        """
        Обновить данные пользователя из Discord
        """
        if discord_username is not None:
            user.discord_username = discord_username
        if discord_discriminator is not None:
            user.discord_discriminator = discord_discriminator
        if discord_avatar is not None:
            user.discord_avatar = discord_avatar
        if minecraft_username is not None:
            user.minecraft_username = minecraft_username
        if minecraft_uuid is not None:
            user.minecraft_uuid = minecraft_uuid
        if role is not None:
            user.role = role
        if discord_roles is not None:
            user.discord_roles = discord_roles
        if discord_access_token is not None:
            user.discord_access_token = discord_access_token
        if discord_refresh_token is not None:
            user.discord_refresh_token = discord_refresh_token
        if discord_expires_at is not None:
            user.discord_expires_at = discord_expires_at

        user.last_role_check = datetime.utcnow()

        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def update_role_check(self, db: Session, *, user: User) -> User:
        """
        Обновить время последней проверки ролей
        """
        user.last_role_check = datetime.utcnow()
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def get_users_for_role_check(self, db: Session, *, minutes_ago: int = 30) -> List[User]:
        """
        Получить пользователей, которым нужно проверить роли
        """
        cutoff_time = datetime.utcnow() - timedelta(minutes=minutes_ago)
        return (
            db.query(User)
            .filter(User.is_active == True)
            .filter(
                (User.last_role_check == None) |
                (User.last_role_check < cutoff_time)
            )
            .all()
        )

    def get_by_minecraft_username(self, db: Session, *, minecraft_username: str) -> Optional[User]:
        """
        Получить пользователя по Minecraft имени
        """
        return db.query(User).filter(User.minecraft_username == minecraft_username).first()

    def get_by_minecraft_uuid(self, db: Session, *, minecraft_uuid: str) -> Optional[User]:
        """
        Получить пользователя по Minecraft UUID
        """
        return db.query(User).filter(User.minecraft_uuid == minecraft_uuid).first()

    def get_active_users(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[User]:
        """
        Получить активных пользователей
        """
        return (
            db.query(User)
            .filter(User.is_active == True)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_users_by_role(self, db: Session, *, role: str) -> List[User]:
        """
        Получить пользователей по роли
        """
        return db.query(User).filter(User.role == role).all()

    def deactivate_user(self, db: Session, *, user: User) -> User:
        """
        Деактивировать пользователя
        """
        user.is_active = False
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def activate_user(self, db: Session, *, user: User) -> User:
        """
        Активировать пользователя
        """
        user.is_active = True
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def get_statistics(self, db: Session) -> Dict[str, Any]:
        """
        Получить статистику пользователей
        """
        total_users = db.query(func.count(User.id)).scalar()
        active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar()
        admin_users = db.query(func.count(User.id)).filter(User.role == "admin").scalar()
        police_users = db.query(func.count(User.id)).filter(User.role == "police").scalar()

        return {
            "total_users": total_users,
            "active_users": active_users,
            "admin_users": admin_users,
            "police_users": police_users
        }

    def is_active(self, user: User) -> bool:
        """
        Проверить активность пользователя
        """
        return user.is_active

    def is_admin(self, user: User) -> bool:
        """
        Проверить права администратора
        """
        return user.role == "admin"

    def is_police_or_admin(self, user: User) -> bool:
        """
        Проверить права полицейского или администратора
        """
        return user.role in ["police", "admin"]


user_crud = CRUDUser(User)