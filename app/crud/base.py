from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union

from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import Base

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    Базовый класс для CRUD операций
    """

    def __init__(self, model: Type[ModelType]):
        """
        CRUD object with default methods to Create, Read, Update, Delete (CRUD).

        **Parameters**

        * `model`: A SQLAlchemy model class
        * `schema`: A Pydantic model (schema) class
        """
        self.model = model

    def _process_enum_values(self, data: dict) -> dict:
        """
        Преобразует enum значения в строки
        """
        processed_data = {}
        for key, value in data.items():
            if hasattr(value, 'value'):  # Если это enum
                processed_data[key] = value.value
            else:
                processed_data[key] = value
        return processed_data

    def get(self, db: Session, id: Any) -> Optional[ModelType]:
        """
        Получить объект по ID
        """
        return db.query(self.model).filter(self.model.id == id).first()

    def get_multi(
            self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[ModelType]:
        """
        Получить список объектов с пагинацией
        """
        return db.query(self.model).offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: CreateSchemaType) -> ModelType:
        """
        Создать новый объект
        """
        obj_in_data = obj_in.model_dump()
        obj_in_data = self._process_enum_values(obj_in_data)  # Обрабатываем enum
        db_obj = self.model(**obj_in_data)  # type: ignore
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
            self,
            db: Session,
            *,
            db_obj: ModelType,
            obj_in: Union[UpdateSchemaType, Dict[str, Any]]
    ) -> ModelType:
        """
        Обновить существующий объект
        """
        obj_data = jsonable_encoder(db_obj)
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)

        update_data = self._process_enum_values(update_data)  # Обрабатываем enum

        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, *, id: int) -> ModelType:
        """
        Удалить объект по ID
        """
        obj = db.query(self.model).get(id)
        db.delete(obj)
        db.commit()
        return obj