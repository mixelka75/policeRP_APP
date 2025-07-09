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
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    passport_id: Optional[int] = Query(None, description="Фильтр по ID паспорта"),
    current_user: User = Depends(get_current_police_or_admin),
):
    """
    Получить список штрафов
    """
    fines = fine_crud.get_multi(db, skip=skip, limit=limit)
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
    return fine


@router.get("/{fine_id}", response_model=Fine)
def read_fine(
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
    
    fine = fine_crud.update(db, db_obj=fine, obj_in=fine_in)
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
    
    fine = fine_crud.remove(db, id=fine_id)
    return fine