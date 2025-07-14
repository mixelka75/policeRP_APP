from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_police_or_admin
from app.crud.fine import fine_crud
from app.crud.passport import passport_crud
from app.schemas.fine import Fine, FineCreate, FineUpdate
from app.models.user import User
from app.utils.logger import ActionLogger

router = APIRouter()


@router.get("/", response_model=List[Fine])
def read_fines(
        request: Request,
        db: Session = Depends(get_db),
        skip: int = 0,
        limit: int = 100,
        passport_id: Optional[int] = Query(None, description="Фильтр по ID паспорта"),
        current_user: User = Depends(get_current_police_or_admin),
):
    """
    Получить список штрафов
    """
    if passport_id:
        fines = fine_crud.get_by_passport_id(db, passport_id=passport_id, skip=skip, limit=limit)
    else:
        fines = fine_crud.get_multi(db, skip=skip, limit=limit)

    # Логируем просмотр списка штрафов
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="VIEW_LIST",
        entity_type="fine",
        details={
            "count": len(fines),
            "skip": skip,
            "limit": limit,
            "passport_id_filter": passport_id
        },
        request=request
    )

    return fines


@router.post("/", response_model=Fine)
def create_fine(
        request: Request,
        *,
        db: Session = Depends(get_db),
        fine_in: FineCreate,
        current_user: User = Depends(get_current_police_or_admin),
):
    """
    Создать новый штраф
    """
    # Проверяем, что паспорт существует
    passport = passport_crud.get(db, id=fine_in.passport_id)
    if not passport:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Паспорт не найден",
        )

    fine = fine_crud.create_with_user(
        db, obj_in=fine_in, created_by_user_id=current_user.id
    )

    # Логируем создание штрафа
    ActionLogger.log_fine_created(
        db=db,
        user=current_user,
        fine_id=fine.id,
        fine_data={
            "passport_id": fine.passport_id,
            "article": fine.article,
            "amount": fine.amount,
            "description": fine.description,
            "passport_nickname": passport.nickname
        },
        request=request
    )

    return fine


@router.get("/{fine_id}", response_model=Fine)
def read_fine(
        request: Request,
        *,
        db: Session = Depends(get_db),
        fine_id: int,
        current_user: User = Depends(get_current_police_or_admin),
):
    """
    Получить штраф по ID
    """
    fine = fine_crud.get(db, id=fine_id)
    if not fine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Штраф не найден",
        )

    # Логируем просмотр конкретного штрафа
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="VIEW",
        entity_type="fine",
        entity_id=fine.id,
        details={
            "passport_id": fine.passport_id,
            "article": fine.article,
            "amount": fine.amount
        },
        request=request
    )

    return fine


@router.put("/{fine_id}", response_model=Fine)
def update_fine(
        request: Request,
        *,
        db: Session = Depends(get_db),
        fine_id: int,
        fine_in: FineUpdate,
        current_user: User = Depends(get_current_police_or_admin),
):
    """
    Обновить штраф
    """
    fine = fine_crud.get(db, id=fine_id)
    if not fine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Штраф не найден",
        )

    # Сохраняем старые данные для логирования
    old_data = {
        "passport_id": fine.passport_id,
        "article": fine.article,
        "amount": fine.amount,
        "description": fine.description
    }

    fine = fine_crud.update(db, db_obj=fine, obj_in=fine_in)

    # Подготавливаем новые данные для логирования
    new_data = {
        "passport_id": fine.passport_id,
        "article": fine.article,
        "amount": fine.amount,
        "description": fine.description
    }

    # Логируем обновление штрафа
    ActionLogger.log_fine_updated(
        db=db,
        user=current_user,
        fine_id=fine.id,
        old_data=old_data,
        new_data=new_data,
        request=request
    )

    return fine


@router.delete("/{fine_id}", response_model=Fine)
def delete_fine(
        request: Request,
        *,
        db: Session = Depends(get_db),
        fine_id: int,
        current_user: User = Depends(get_current_police_or_admin),
):
    """
    Удалить штраф
    """
    fine = fine_crud.get(db, id=fine_id)
    if not fine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Штраф не найден",
        )

    # Сохраняем данные штрафа для логирования
    fine_data = {
        "passport_id": fine.passport_id,
        "article": fine.article,
        "amount": fine.amount,
        "description": fine.description
    }

    fine = fine_crud.remove(db, id=fine_id)

    # Логируем удаление штрафа
    ActionLogger.log_fine_deleted(
        db=db,
        user=current_user,
        fine_id=fine_id,
        fine_data=fine_data,
        request=request
    )

    return fine