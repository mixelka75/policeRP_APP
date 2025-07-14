from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_police_or_admin
from app.crud.passport import passport_crud
from app.schemas.passport import (
    Passport,
    PassportCreate,
    PassportUpdate,
    PassportInfo,
    PassportEmergencyUpdate,
    PassportEmergencyResponse
)
from app.models.user import User
from app.utils.logger import ActionLogger

router = APIRouter()


@router.get("/", response_model=List[Passport])
def read_passports(
        db: Session = Depends(get_db),
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = Query(None, description="Поиск по имени, фамилии или никнейму"),
        city: Optional[str] = Query(None, description="Фильтр по городу"),
        emergency_only: Optional[bool] = Query(None, description="Показать только ЧС"),
        current_user: User = Depends(get_current_police_or_admin),
):
    """
    Получить список паспортов с возможностью поиска
    """
    if emergency_only:
        passports = passport_crud.get_emergency_passports(db, skip=skip, limit=limit)
    elif city:
        passports = passport_crud.get_by_city(db, city=city)
    else:
        passports = passport_crud.get_multi(db, skip=skip, limit=limit)
    return passports


@router.get("/emergency", response_model=List[Passport])
def read_emergency_passports(
        db: Session = Depends(get_db),
        skip: int = 0,
        limit: int = 100,
        current_user: User = Depends(get_current_police_or_admin),
):
    """
    Получить список паспортов в ЧС
    """
    passports = passport_crud.get_emergency_passports(db, skip=skip, limit=limit)
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
    # Проверяем, что никнейм уникален
    if passport_crud.check_nickname_exists(db, nickname=passport_in.nickname):
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
        passport_data=passport_in.model_dump(),
        request=request
    )

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

    # Проверяем уникальность никнейма при изменении
    if passport_in.nickname and passport_in.nickname != passport.nickname:
        if passport_crud.check_nickname_exists(db, nickname=passport_in.nickname, exclude_id=passport_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Паспорт с таким никнеймом уже существует",
            )

    # Сохраняем старые данные для логов
    old_data = {
        "nickname": passport.nickname,
        "first_name": passport.first_name,
        "last_name": passport.last_name,
        "city": passport.city
    }

    passport = passport_crud.update(db, db_obj=passport, obj_in=passport_in)

    # Логируем обновление паспорта
    ActionLogger.log_passport_updated(
        db=db,
        user=current_user,
        passport_id=passport.id,
        old_data=old_data,
        new_data=passport_in.model_dump(exclude_unset=True),
        request=request
    )

    return passport


@router.post("/{passport_id}/emergency", response_model=PassportEmergencyResponse)
def toggle_emergency_status(
        request: Request,
        *,
        db: Session = Depends(get_db),
        passport_id: int,
        emergency_data: PassportEmergencyUpdate,
        current_user: User = Depends(get_current_police_or_admin),
):
    """
    Добавить/убрать паспорт из ЧС
    """
    passport = passport_crud.get(db, id=passport_id)
    if not passport:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Паспорт не найден",
        )

    # Обновляем ЧС статус
    passport = passport_crud.set_emergency_status(
        db,
        passport_id=passport_id,
        is_emergency=emergency_data.is_emergency
    )

    # Определяем сообщение
    action = "ДОБАВЛЕН В ЧС" if emergency_data.is_emergency else "УБРАН ИЗ ЧС"
    message = f"Житель {passport.nickname} {action}"

    # Логируем изменение ЧС статуса
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="EMERGENCY_STATUS_CHANGE",
        entity_type="passport",
        entity_id=passport_id,
        details={
            "nickname": passport.nickname,
            "is_emergency": emergency_data.is_emergency,
            "reason": emergency_data.reason,
            "action": action
        },
        request=request
    )

    return PassportEmergencyResponse(
        id=passport.id,
        nickname=passport.nickname,
        is_emergency=passport.is_emergency,
        message=message
    )


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

    # Сохраняем данные для логов
    passport_data = {
        "nickname": passport.nickname,
        "first_name": passport.first_name,
        "last_name": passport.last_name,
        "city": passport.city
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