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
        request: Request,
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

    # Логируем просмотр списка паспортов
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="VIEW_LIST",
        entity_type="passport",
        details={
            "count": len(passports),
            "skip": skip,
            "limit": limit,
            "search": search
        },
        request=request
    )

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
    # Проверяем, что никнейм не занят
    existing_passport = passport_crud.get_by_nickname(db, nickname=passport_in.nickname)
    if existing_passport:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Паспорт с таким никнеймом уже существует",
        )

    passport = passport_crud.create(db, obj_in=passport_in)

    # Логируем создание паспорта
    ActionLogger.log_passport_created(
        db=db,
        user=current_user,
        passport_id=passport.id,
        passport_data={
            "nickname": passport.nickname,
            "first_name": passport.first_name,
            "last_name": passport.last_name,
            "age": passport.age,
            "gender": passport.gender
        },
        request=request
    )

    return passport


@router.get("/{passport_id}", response_model=Passport)
def read_passport(
        request: Request,
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

    # Логируем просмотр конкретного паспорта
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="VIEW",
        entity_type="passport",
        entity_id=passport.id,
        details={
            "nickname": passport.nickname,
            "full_name": f"{passport.first_name} {passport.last_name}"
        },
        request=request
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

    # Проверяем, что новый никнейм не занят
    if passport_in.nickname and passport_in.nickname != passport.nickname:
        existing_passport = passport_crud.get_by_nickname(db, nickname=passport_in.nickname)
        if existing_passport:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Паспорт с таким никнеймом уже существует",
            )

    # Сохраняем старые данные для логирования
    old_data = {
        "nickname": passport.nickname,
        "first_name": passport.first_name,
        "last_name": passport.last_name,
        "age": passport.age,
        "gender": passport.gender
    }

    passport = passport_crud.update(db, db_obj=passport, obj_in=passport_in)

    # Подготавливаем новые данные для логирования
    new_data = {
        "nickname": passport.nickname,
        "first_name": passport.first_name,
        "last_name": passport.last_name,
        "age": passport.age,
        "gender": passport.gender
    }

    # Логируем обновление паспорта
    ActionLogger.log_passport_updated(
        db=db,
        user=current_user,
        passport_id=passport.id,
        old_data=old_data,
        new_data=new_data,
        request=request
    )

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

    # Сохраняем данные паспорта для логирования
    passport_data = {
        "nickname": passport.nickname,
        "first_name": passport.first_name,
        "last_name": passport.last_name,
        "age": passport.age,
        "gender": passport.gender
    }

    passport = passport_crud.remove(db, id=passport_id)

    # Логируем удаление паспорта
    ActionLogger.log_passport_deleted(
        db=db,
        user=current_user,
        passport_id=passport_id,
        passport_data=passport_data,
        request=request
    )

    return passport