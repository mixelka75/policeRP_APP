from typing import List, Optional

from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.passport import Passport
from app.schemas.passport import PassportCreate, PassportUpdate


class CRUDPassport(CRUDBase[Passport, PassportCreate, PassportUpdate]):
    """
    CRUD операции для паспортов
    """
    
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
        from app.models.passport import Gender
        return db.query(Passport).filter(Passport.gender == Gender(gender)).all()

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