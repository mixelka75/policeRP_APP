from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.crud.base import CRUDBase
from app.models.passport import Passport
from app.schemas.passport import PassportCreate, PassportUpdate


class CRUDPassport(CRUDBase[Passport, PassportCreate, PassportUpdate]):
    """
    CRUD операции для паспортов
    """

    def create(self, db: Session, *, obj_in: PassportCreate) -> Passport:
        """
        Создать паспорт с автоматическим подсчетом нарушений
        """
        obj_in_data = obj_in.model_dump()

        # ИСПРАВЛЕНИЕ: Преобразуем enum в строку
        if hasattr(obj_in_data.get('gender'), 'value'):
            obj_in_data['gender'] = obj_in_data['gender'].value
        elif isinstance(obj_in_data.get('gender'), str):
            # Если уже строка, оставляем как есть
            pass

        obj_in_data["violations_count"] = 0  # При создании нарушений еще нет
        obj_in_data["is_emergency"] = False  # По умолчанию не в ЧС

        db_obj = Passport(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
            self, db: Session, *, db_obj: Passport, obj_in: PassportUpdate
    ) -> Passport:
        """
        Обновить паспорт с правильным преобразованием enum
        """
        update_data = obj_in.model_dump(exclude_unset=True)

        # ИСПРАВЛЕНИЕ: Преобразуем enum в строку при обновлении
        if 'gender' in update_data:
            gender_value = update_data['gender']
            if hasattr(gender_value, 'value'):
                update_data['gender'] = gender_value.value
            elif isinstance(gender_value, str):
                pass  # Уже строка

        return super().update(db, db_obj=db_obj, obj_in=update_data)

    def update_violations_count(self, db: Session, *, passport_id: int) -> None:
        """
        Обновить количество нарушений для паспорта
        """
        from app.models.fine import Fine

        violations_count = db.query(func.count(Fine.id)).filter(
            Fine.passport_id == passport_id
        ).scalar()

        db.query(Passport).filter(Passport.id == passport_id).update({
            "violations_count": violations_count
        })
        db.commit()

    def set_emergency_status(self, db: Session, *, passport_id: int, is_emergency: bool) -> Optional[Passport]:
        """
        Установить ЧС статус для паспорта
        """
        passport = self.get(db, id=passport_id)
        if not passport:
            return None

        passport.is_emergency = is_emergency
        db.add(passport)
        db.commit()
        db.refresh(passport)
        return passport

    def get_by_nickname(self, db: Session, *, nickname: str) -> Optional[Passport]:
        """
        Получить паспорт по никнейму
        """
        return db.query(Passport).filter(Passport.nickname == nickname).first()

    def search_by_name(
            self, db: Session, *, first_name: str = None, last_name: str = None
    ) -> List[Passport]:
        """
        Поиск паспортов по имени или фамилии
        """
        query = db.query(Passport)

        if first_name:
            query = query.filter(Passport.first_name.ilike(f"%{first_name}%"))
        if last_name:
            query = query.filter(Passport.last_name.ilike(f"%{last_name}%"))

        return query.all()

    def get_by_city(self, db: Session, *, city: str) -> List[Passport]:
        """
        Получить паспорта по городу
        """
        return db.query(Passport).filter(Passport.city.ilike(f"%{city}%")).all()

    def get_by_age_range(
            self, db: Session, *, min_age: int = None, max_age: int = None
    ) -> List[Passport]:
        """
        Получить паспорта в определенном возрастном диапазоне
        """
        query = db.query(Passport)

        if min_age is not None:
            query = query.filter(Passport.age >= min_age)
        if max_age is not None:
            query = query.filter(Passport.age <= max_age)

        return query.all()

    def get_by_gender(self, db: Session, *, gender: str) -> List[Passport]:
        """
        Получить паспорта по полу
        """
        return db.query(Passport).filter(Passport.gender == gender).all()

    def get_emergency_passports(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[Passport]:
        """
        Получить паспорта с ЧС статусом
        """
        return (
            db.query(Passport)
            .filter(Passport.is_emergency == True)
            .order_by(Passport.updated_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_multi_with_fines(
            self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[Passport]:
        """
        Получить список паспортов с информацией о штрафах
        """
        return (
            db.query(Passport)
            .options(db.joinedload(Passport.fines))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def check_nickname_exists(self, db: Session, *, nickname: str, exclude_id: int = None) -> bool:
        """
        Проверить существование никнейма
        """
        query = db.query(Passport).filter(Passport.nickname == nickname)
        if exclude_id:
            query = query.filter(Passport.id != exclude_id)
        return query.first() is not None


passport_crud = CRUDPassport(Passport)