from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_police_or_admin
from app.crud.passport import passport_crud
from app.schemas.passport import Passport, PassportCreate, PassportUpdate, PassportInfo
from app.models.user import User
from app.utils.logger import ActionLogger

router = APIRouter()


@router.get("/", response_model=List[Passport])
def read_passports(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None, description="Поиск по имени, фамилии или никнейму"),
    current_user: User = Depends(get_current_police_or_admin),
):
    """
    Получить список паспортов с возможностью поиска
    """
    passports = passport_crud.get_multi(db, skip=skip, limit=limit)
    return passports


@router.post("/", response_model=Passport)
def create_passport(
    request: Request,
    *,
    db: Session = Depends(get_db),
    passport_in: PassportCreate,
    current_user: User = Depends(get_current_police_or_admin),
):
    """
    Создать новый паспорт
    """
    passport = passport_crud.create(db, obj_in=passport_in)
    return passport


@router.get("/{passport_id}", response_model=Passport)
def read_passport(
    *,
    db: Session = Depends(get_db),
    passport_id: int,
    current_user: User = Depends(get_current_police_or_admin),
):
    """
    Получить паспорт по ID
    """
    passport = passport_crud.get(db, id=passport_id)
    if not passport:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Паспорт не найден",
        )
    return passport


@router.put("/{passport_id}", response_model=Passport)
def update_passport(
    request: Request,
    *,
    db: Session = Depends(get_db),
    passport_id: int,
    passport_in: PassportUpdate,
    current_user: User = Depends(get_current_police_or_admin),
):
    """
    Обновить паспорт
    """
    passport = passport_crud.get(db, id=passport_id)
    if not passport:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Паспорт не найден",
        )
    
    passport = passport_crud.update(db, db_obj=passport, obj_in=passport_in)
    return passport


@router.delete("/{passport_id}", response_model=Passport)
def delete_passport(
    request: Request,
    *,
    db: Session = Depends(get_db),
    passport_id: int,
    current_user: User = Depends(get_current_police_or_admin),
):
    """
    Удалить паспорт
    """
    passport = passport_crud.get(db, id=passport_id)
    if not passport:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Паспорт не найден",
        )
    
    passport = passport_crud.remove(db, id=passport_id)
    return passport