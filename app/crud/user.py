from typing import Optional

from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password
from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    """
    CRUD операции для пользователей
    """

    def get_by_username(self, db: Session, *, username: str) -> Optional[User]:
        """
        Получить пользователя по имени пользователя
        """
        return db.query(User).filter(User.username == username).first()

    def create(self, db: Session, *, obj_in: UserCreate) -> User:
        """
        Создать нового пользователя с хешированием пароля
        """
        # ИСПРАВЛЕНО: преобразуем enum в строку
        role_value = obj_in.role.value if hasattr(obj_in.role, 'value') else str(obj_in.role)

        db_obj = User(
            username=obj_in.username,
            password_hash=get_password_hash(obj_in.password),
            role=role_value,  # Используем строковое значение
            is_active=obj_in.is_active,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
            self, db: Session, *, db_obj: User, obj_in: UserUpdate
    ) -> User:
        """
        Обновить пользователя с хешированием пароля при необходимости
        """
        update_data = obj_in.model_dump(exclude_unset=True)

        # ИСПРАВЛЕНО: обработка пароля
        if "password" in update_data:
            hashed_password = get_password_hash(update_data["password"])
            del update_data["password"]
            update_data["password_hash"] = hashed_password

        # ИСПРАВЛЕНО: обработка роли - преобразуем enum в строку
        if "role" in update_data:
            role_value = update_data["role"]
            if hasattr(role_value, 'value'):
                update_data["role"] = role_value.value
            else:
                update_data["role"] = str(role_value)

        return super().update(db, db_obj=db_obj, obj_in=update_data)

    def authenticate(self, db: Session, *, username: str, password: str) -> Optional[User]:
        """
        Аутентификация пользователя
        """
        user = self.get_by_username(db, username=username)
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user

    def is_active(self, user: User) -> bool:
        """
        Проверить активность пользователя
        """
        return user.is_active

    def is_admin(self, user: User) -> bool:
        """
        Проверить права администратора
        """
        # ИСПРАВЛЕНО: сравниваем строковые значения
        return user.role == "admin"


user_crud = CRUDUser(User)