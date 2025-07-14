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
        # Подготавливаем данные
        obj_in_data = obj_in.model_dump()

        # Хешируем пароль
        obj_in_data["password_hash"] = get_password_hash(obj_in_data.pop("password"))

        # ИСПРАВЛЕНИЕ: обработка роли enum - базовый класс сам обработает enum
        # Просто создаем пользователя через базовый метод, который обработает enum
        db_obj = User(**self._process_enum_values(obj_in_data))
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

        # ИСПРАВЛЕНИЕ: используем базовый метод update, который обработает enum автоматически
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