from typing import List, Optional

from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.passport import Passport
from app.schemas.passport import PassportCreate, PassportUpdate


class CRUDPassport(CRUDBase[Passport, PassportCreate, PassportUpdate]):
    """
    CRUD операции для паспортов
    """

    def create(self, db: Session, *, obj_in: PassportCreate) -> Passport:
        """
        Создать новый паспорт с обработкой enum
        """
        obj_in_data = obj_in.model_dump()

        # ИСПРАВЛЕНИЕ: обработка gender enum - преобразуем в строку
        if "gender" in obj_in_data:
            gender_value = obj_in_data["gender"]
            if hasattr(gender_value, 'value'):
                obj_in_data["gender"] = gender_value.value
            else:
                obj_in_data["gender"] = str(gender_value)

        # city_entry_date устанавливается автоматически в модели через default=func.now()

        db_obj = Passport(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
            self,
            db: Session,
            *,
            db_obj: Passport,
            obj_in: PassportUpdate
    ) -> Passport:
        """
        Обновить паспорт с обработкой enum
        """
        update_data = obj_in.model_dump(exclude_unset=True)

        # ИСПРАВЛЕНИЕ: обработка gender enum - преобразуем в строку
        if "gender" in update_data:
            gender_value = update_data["gender"]
            if hasattr(gender_value, 'value'):
                update_data["gender"] = gender_value.value
            else:
                update_data["gender"] = str(gender_value)

        # Убираем city_entry_date из обновления, если оно случайно попало
        update_data.pop('city_entry_date', None)

        return super().update(db, db_obj=db_obj, obj_in=update_data)

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

    def get_multi_with_fines(
            self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[Passport]:
        """
        Получить список паспортов с информацией о штрафах
        """
        from sqlalchemy.orm import joinedload
        return (
            db.query(Passport)
            .options(joinedload(Passport.fines))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_with_violations_count(
            self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[dict]:
        """
        Получить паспорта с подсчетом нарушений
        """
        from sqlalchemy import func
        from app.models.fine import Fine

        result = (
            db.query(
                Passport,
                func.count(Fine.id).label('violations_count')
            )
            .outerjoin(Fine, Passport.id == Fine.passport_id)
            .group_by(Passport.id)
            .offset(skip)
            .limit(limit)
            .all()
        )

        return [
            {
                **passport.__dict__,
                'violations_count': violations_count
            }
            for passport, violations_count in result
        ]

    def check_nickname_exists(self, db: Session, *, nickname: str, exclude_id: int = None) -> bool:
        """
        Проверить существование никнейма
        """
        query = db.query(Passport).filter(Passport.nickname == nickname)
        if exclude_id:
            query = query.filter(Passport.id != exclude_id)
        return query.first() is not None


passport_crud = CRUDPassport(Passport)