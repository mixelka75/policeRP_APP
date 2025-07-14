from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_active_admin, get_current_police_or_admin
from app.crud.log import log_crud
from app.schemas.log import Log
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=List[Log])
def read_logs(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[int] = Query(None, description="Фильтр по ID пользователя"),
    action: Optional[str] = Query(None, description="Фильтр по типу действия"),
    entity_type: Optional[str] = Query(None, description="Фильтр по типу сущности"),
    current_user: User = Depends(get_current_active_admin),
):
    """
    Получить список логов (только для администраторов)
    """
    logs = log_crud.get_multi(db, skip=skip, limit=limit)
    return logs


@router.get("/my", response_model=List[Log])
def read_my_logs(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_police_or_admin),
):
    """
    Получить логи текущего пользователя
    """
    logs = log_crud.get_by_user_id(db, user_id=current_user.id, skip=skip, limit=limit)
    return logs