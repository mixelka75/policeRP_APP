from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_police_or_admin, get_current_user
from app.core.decorators import with_role_check
from app.crud.fine import fine_crud
from app.crud.passport import passport_crud
from app.schemas.fine import Fine, FineCreate, FineUpdate
from app.models.user import User
from app.utils.logger import ActionLogger

router = APIRouter()


@router.get("/", response_model=List[Fine])
@with_role_check("view_fines")
async def read_fines(
        request: Request,
        db: Session = Depends(get_db),
        skip: int = 0,
        limit: int = 100,
        passport_id: Optional[int] = Query(None, description="Фильтр по ID паспорта"),
        article: Optional[str] = Query(None, description="Фильтр по статье"),
        min_amount: Optional[int] = Query(None, description="Минимальная сумма штрафа"),
        max_amount: Optional[int] = Query(None, description="Максимальная сумма штрафа"),
        current_user: User = Depends(get_current_police_or_admin),
):
    """
    Получить список штрафов с фильтрами
    """
    if passport_id:
        fines = fine_crud.get_by_passport_id(db, passport_id=passport_id, skip=skip, limit=limit)
    elif article:
        fines = fine_crud.get_by_article(db, article=article, skip=skip, limit=limit)
    elif min_amount is not None or max_amount is not None:
        fines = fine_crud.get_by_amount_range(db, min_amount=min_amount, max_amount=max_amount)
        # Применяем пагинацию для фильтра по сумме
        fines = fines[skip:skip + limit]
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
            "passport_id_filter": passport_id,
            "article_filter": article,
            "amount_range": f"{min_amount}-{max_amount}" if (min_amount or max_amount) else None,
            "officer": current_user.minecraft_username
        },
        request=request
    )

    return fines


@router.get("/my", response_model=List[Fine])
def read_my_fines(
        request: Request,
        db: Session = Depends(get_db),
        skip: int = 0,
        limit: int = 100,
        current_user: User = Depends(get_current_police_or_admin),
):
    """
    Получить штрафы, выписанные текущим пользователем
    """
    fines = fine_crud.get_by_user_id(db, user_id=current_user.id, skip=skip, limit=limit)

    # Логируем просмотр собственных штрафов
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="VIEW_MY_FINES",
        entity_type="fine",
        details={
            "count": len(fines),
            "skip": skip,
            "limit": limit,
            "officer": current_user.minecraft_username
        },
        request=request
    )

    return fines


@router.get("/me", response_model=List[Fine])
async def read_fines_on_me(
        request: Request,
        db: Session = Depends(get_db),
        skip: int = 0,
        limit: int = 100,
        current_user: User = Depends(get_current_user),
):
    """
    Получить штрафы, выписанные на меня (для обычных пользователей с паспортом)
    """
    # Находим паспорт текущего пользователя
    passport = passport_crud.get_by_discord_id(db, discord_id=str(current_user.discord_id))
    if not passport:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="У вас нет паспорта в системе",
        )

    # Получаем штрафы по ID паспорта
    fines = fine_crud.get_by_passport_id(db, passport_id=passport.id, skip=skip, limit=limit)

    # Логируем просмотр собственных штрафов
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="VIEW_FINES_ON_ME",
        entity_type="fine",
        details={
            "passport_id": passport.id,
            "count": len(fines),
            "skip": skip,
            "limit": limit,
            "nickname": passport.nickname
        },
        request=request
    )

    return fines


@router.post("/", response_model=Fine)
@with_role_check("create_fine")
async def create_fine(
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
            "passport_nickname": passport.nickname,
            "officer": current_user.minecraft_username
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
            "amount": fine.amount,
            "officer": current_user.minecraft_username
        },
        request=request
    )

    return fine


@router.put("/{fine_id}", response_model=Fine)
@with_role_check("update_fine")
async def update_fine(
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

    # Проверяем права: админ может редактировать любые штрафы,
    # полицейский - только свои
    if current_user.role != "admin" and fine.created_by_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы можете редактировать только свои штрафы",
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
@with_role_check("delete_fine")
async def delete_fine(
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

    # Проверяем права: админ может удалять любые штрафы,
    # полицейский - только свои
    if current_user.role != "admin" and fine.created_by_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы можете удалять только свои штрафы",
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


@router.get("/passport/{passport_id}/total")
def get_passport_fine_total(
        request: Request,
        *,
        db: Session = Depends(get_db),
        passport_id: int,
        current_user: User = Depends(get_current_police_or_admin),
):
    """
    Получить общую сумму штрафов для паспорта
    """
    # Проверяем, что паспорт существует
    passport = passport_crud.get(db, id=passport_id)
    if not passport:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Паспорт не найден",
        )

    total_amount = fine_crud.get_total_amount_by_passport(db, passport_id=passport_id)

    # Логируем просмотр суммы штрафов
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="VIEW_FINE_TOTAL",
        entity_type="fine",
        details={
            "passport_id": passport_id,
            "passport_nickname": passport.nickname,
            "total_amount": total_amount,
            "officer": current_user.minecraft_username
        },
        request=request
    )

    return {
        "passport_id": passport_id,
        "passport_nickname": passport.nickname,
        "total_amount": total_amount,
        "violations_count": passport.violations_count
    }


@router.get("/statistics/officer/{user_id}")
def get_officer_statistics(
        request: Request,
        *,
        db: Session = Depends(get_db),
        user_id: int,
        current_user: User = Depends(get_current_police_or_admin),
):
    """
    Получить статистику штрафов по сотруднику
    """
    # Проверяем права: пользователь может просматривать только свою статистику,
    # админ - любую
    if current_user.role != "admin" and user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для просмотра статистики другого пользователя",
        )

    stats = fine_crud.get_statistics_by_user(db, user_id=user_id)

    # Получаем информацию о пользователе
    from app.crud.user import user_crud
    target_user = user_crud.get(db, id=user_id)

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден",
        )

    # Логируем просмотр статистики
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="VIEW_OFFICER_STATISTICS",
        entity_type="fine",
        details={
            "target_user_id": user_id,
            "target_username": target_user.minecraft_username,
            "stats": stats,
            "viewed_by": current_user.minecraft_username
        },
        request=request
    )

    return {
        "user_id": user_id,
        "username": target_user.minecraft_username,
        "discord_username": target_user.discord_username,
        "statistics": stats
    }


@router.get("/statistics/overview")
def get_fines_overview(
        request: Request,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_police_or_admin),
):
    """
    Получить общую статистику по штрафам
    """
    from sqlalchemy import func
    from app.models.fine import Fine as FineModel

    # Общая статистика
    total_fines = db.query(func.count(FineModel.id)).scalar()
    total_amount = db.query(func.sum(FineModel.amount)).scalar()
    avg_amount = db.query(func.avg(FineModel.amount)).scalar()

    # Топ статей нарушений
    top_articles = db.query(
        FineModel.article,
        func.count(FineModel.id).label('count'),
        func.sum(FineModel.amount).label('total_amount')
    ).group_by(FineModel.article).order_by(func.count(FineModel.id).desc()).limit(10).all()

    # Статистика по сотрудникам
    officer_stats = db.query(
        FineModel.created_by_user_id,
        func.count(FineModel.id).label('count'),
        func.sum(FineModel.amount).label('total_amount')
    ).group_by(FineModel.created_by_user_id).order_by(func.count(FineModel.id).desc()).all()

    # Получаем имена сотрудников
    from app.crud.user import user_crud
    officer_details = []
    for user_id, count, amount in officer_stats:
        user = user_crud.get(db, id=user_id)
        officer_details.append({
            "user_id": user_id,
            "username": user.minecraft_username if user else "Unknown",
            "discord_username": user.discord_username if user else "Unknown",
            "fines_count": count,
            "total_amount": amount or 0
        })

    stats = {
        "total_fines": total_fines,
        "total_amount": total_amount or 0,
        "average_amount": float(avg_amount) if avg_amount else 0,
        "top_articles": [
            {
                "article": article,
                "count": count,
                "total_amount": total_amount or 0
            }
            for article, count, total_amount in top_articles
        ],
        "officers": officer_details
    }

    # Логируем просмотр общей статистики
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="VIEW_FINES_OVERVIEW",
        entity_type="fine",
        details={
            "stats": stats,
            "officer": current_user.minecraft_username
        },
        request=request
    )

    return stats