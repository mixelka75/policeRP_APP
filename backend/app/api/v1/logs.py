from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.deps import get_current_active_admin, get_current_police_or_admin
from app.core.decorators import with_role_check
from app.crud.log import log_crud
from app.schemas.log import Log, LogResponse
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=LogResponse)
@with_role_check("view_logs")
async def read_logs(
        db: Session = Depends(get_db),
        page: int = Query(0, ge=0, description="Номер страницы (с 0)"),
        page_size: int = Query(20, ge=1, le=100, description="Размер страницы"),
        user_id: Optional[int] = Query(None, description="Фильтр по ID пользователя"),
        action: Optional[str] = Query(None, description="Фильтр по типу действия"),
        entity_type: Optional[str] = Query(None, description="Фильтр по типу сущности"),
        entity_id: Optional[int] = Query(None, description="Фильтр по ID сущности"),
        days: Optional[int] = Query(7, description="Количество дней назад (по умолчанию 7)"),
        current_user: User = Depends(get_current_active_admin),
):
    """
    Получить список логов с пагинацией (только для администраторов)
    """
    # Вычисляем skip на основе page и page_size
    skip = page * page_size
    limit = page_size
    
    # Фильтр по дате
    start_date = datetime.now() - timedelta(days=days) if days else None

    if user_id:
        logs = log_crud.get_by_user_id(db, user_id=user_id, skip=skip, limit=limit)
        total_count = log_crud.count_by_user_id(db, user_id=user_id)
    elif action:
        logs = log_crud.get_by_action(db, action=action, skip=skip, limit=limit)
        total_count = log_crud.count_by_action(db, action=action)
    elif entity_type:
        if entity_id:
            logs = log_crud.get_by_entity(db, entity_type=entity_type, entity_id=entity_id)
            total_count = len(logs)
        else:
            logs = log_crud.get_by_entity_type(db, entity_type=entity_type, skip=skip, limit=limit)
            total_count = log_crud.count_by_entity_type(db, entity_type=entity_type)
    elif start_date:
        logs = log_crud.get_by_date_range(db, start_date=start_date, skip=skip, limit=limit)
        total_count = log_crud.count_by_date_range(db, start_date=start_date)
    else:
        logs = log_crud.get_multi(db, skip=skip, limit=limit)
        total_count = log_crud.count_all(db)

    # Преобразуем SQLAlchemy модели в Pydantic схемы
    log_schemas = [Log.model_validate(log) for log in logs]

    # Вычисляем информацию о пагинации
    has_next = (skip + len(logs)) < total_count
    has_prev = page > 0
    total_pages = (total_count + page_size - 1) // page_size

    from app.schemas.log import LogPagination
    
    return LogResponse(
        logs=log_schemas,
        pagination=LogPagination(
            page=page,
            page_size=page_size,
            total_count=total_count,
            total_pages=total_pages,
            has_next=has_next,
            has_prev=has_prev
        )
    )


@router.get("/my", response_model=List[Log])
@with_role_check("view_my_logs")
async def read_my_logs(
        db: Session = Depends(get_db),
        skip: int = 0,
        limit: int = 100,
        action: Optional[str] = Query(None, description="Фильтр по типу действия"),
        entity_type: Optional[str] = Query(None, description="Фильтр по типу сущности"),
        days: Optional[int] = Query(7, description="Количество дней назад (по умолчанию 7)"),
        current_user: User = Depends(get_current_police_or_admin),
):
    """
    Получить логи текущего пользователя
    """
    # Получаем базовые логи пользователя
    logs = log_crud.get_by_user_id(db, user_id=current_user.id, skip=skip, limit=limit)

    # Применяем дополнительные фильтры
    if action:
        logs = [log for log in logs if log.action == action]

    if entity_type:
        logs = [log for log in logs if log.entity_type == entity_type]

    if days:
        cutoff_date = datetime.now() - timedelta(days=days)
        logs = [log for log in logs if log.created_at >= cutoff_date]

    # Преобразуем SQLAlchemy модели в Pydantic схемы
    return [Log.model_validate(log) for log in logs]


@router.get("/activity/{user_id}")
def get_user_activity(
        user_id: int,
        days: int = Query(30, description="Период активности в днях"),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_active_admin),
):
    """
    Получить статистику активности пользователя (только для администраторов)
    """
    # Проверяем, что пользователь существует
    from app.crud.user import user_crud
    target_user = user_crud.get(db, id=user_id)
    if not target_user:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )

    stats = log_crud.get_activity_stats(db, user_id=user_id, days=days)

    return {
        "user_id": user_id,
        "username": target_user.minecraft_username,
        "discord_username": target_user.discord_username,
        "period_days": days,
        "statistics": stats
    }


@router.get("/actions")
def get_available_actions(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_police_or_admin),
):
    """
    Получить список доступных типов действий
    """
    from sqlalchemy import func, distinct
    from app.models.log import Log as LogModel

    actions = db.query(distinct(LogModel.action)).all()
    entity_types = db.query(distinct(LogModel.entity_type)).all()

    return {
        "actions": [action[0] for action in actions if action[0]],
        "entity_types": [entity_type[0] for entity_type in entity_types if entity_type[0]]
    }


@router.get("/security")
def get_security_logs(
        db: Session = Depends(get_db),
        skip: int = 0,
        limit: int = 100,
        days: int = Query(7, description="Количество дней назад"),
        current_user: User = Depends(get_current_active_admin),
):
    """
    Получить логи безопасности (только для администраторов)
    """
    start_date = datetime.now() - timedelta(days=days)

    # Получаем логи связанные с безопасностью
    security_actions = [
        "LOGIN", "LOGOUT", "LOGIN_FAILED", "LOGIN_BLOCKED",
        "TOKEN_CHECK", "SECURITY_EVENT", "ROLE_CHANGED",
        "EMERGENCY_STATUS_CHANGE", "DEACTIVATE", "ACTIVATE"
    ]

    logs = []
    for action in security_actions:
        action_logs = log_crud.get_by_action(db, action=action, skip=0, limit=limit)
        # Фильтруем по дате
        filtered_logs = [log for log in action_logs if log.created_at >= start_date]
        logs.extend(filtered_logs)

    # Сортируем по дате (новые сначала)
    logs.sort(key=lambda x: x.created_at, reverse=True)

    # Применяем пагинацию
    paginated_logs = logs[skip:skip + limit]

    # Преобразуем SQLAlchemy модели в Pydantic схемы
    paginated_log_schemas = [Log.model_validate(log) for log in paginated_logs]
    
    return {
        "logs": paginated_log_schemas,
        "total_security_events": len(logs),
        "period_days": days
    }


@router.get("/export")
def export_logs(
        db: Session = Depends(get_db),
        user_id: Optional[int] = Query(None, description="ID пользователя"),
        action: Optional[str] = Query(None, description="Тип действия"),
        entity_type: Optional[str] = Query(None, description="Тип сущности"),
        days: int = Query(30, description="Период в днях"),
        format: str = Query("json", description="Формат экспорта (json/csv)"),
        current_user: User = Depends(get_current_active_admin),
):
    """
    Экспорт логов (только для администраторов)
    """
    from fastapi.responses import JSONResponse, PlainTextResponse
    import json
    import csv
    from io import StringIO

    # Получаем логи по фильтрам
    start_date = datetime.now() - timedelta(days=days)

    if user_id:
        logs = log_crud.get_by_user_id(db, user_id=user_id)
    elif action:
        logs = log_crud.get_by_action(db, action=action)
    elif entity_type:
        logs = log_crud.get_by_entity_type(db, entity_type=entity_type)
    else:
        logs = log_crud.get_by_date_range(db, start_date=start_date)

    # Фильтруем по дате
    filtered_logs = [log for log in logs if log.created_at >= start_date]

    # Логируем экспорт
    from app.utils.logger import ActionLogger
    ActionLogger.log_export_action(
        db=db,
        user=current_user,
        export_type="logs",
        entity_count=len(filtered_logs),
        export_format=format.upper()
    )

    if format.lower() == "csv":
        # Экспорт в CSV
        output = StringIO()
        writer = csv.writer(output)

        # Заголовки
        writer.writerow([
            "ID", "User ID", "Action", "Entity Type", "Entity ID",
            "IP Address", "Created At", "Details"
        ])

        # Данные
        for log in filtered_logs:
            writer.writerow([
                log.id,
                log.user_id,
                log.action,
                log.entity_type,
                log.entity_id,
                log.ip_address,
                log.created_at.isoformat(),
                json.dumps(log.details) if log.details else ""
            ])

        csv_content = output.getvalue()
        output.close()

        return PlainTextResponse(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=logs_export_{days}days.csv"}
        )

    else:
        # Экспорт в JSON
        logs_data = []
        for log in filtered_logs:
            logs_data.append({
                "id": log.id,
                "user_id": log.user_id,
                "action": log.action,
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "ip_address": log.ip_address,
                "created_at": log.created_at.isoformat(),
                "details": log.details
            })

        return JSONResponse(
            content={
                "export_info": {
                    "total_records": len(logs_data),
                    "period_days": days,
                    "exported_by": current_user.discord_username,
                    "export_date": datetime.now().isoformat()
                },
                "logs": logs_data
            },
            headers={"Content-Disposition": f"attachment; filename=logs_export_{days}days.json"}
        )