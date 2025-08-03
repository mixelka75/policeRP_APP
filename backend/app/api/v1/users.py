from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_active_admin, get_current_user
from app.core.decorators import with_role_check
from app.crud.user import user_crud
from app.schemas.user import User, UserUpdate, UserPublic, UserStatistics, RoleCheckResult
from app.models.user import User as UserModel
from app.utils.logger import ActionLogger
from app.services.role_checker import role_checker_service

router = APIRouter()


@router.get("/me", response_model=User)
def read_user_me(
        request: Request,
        db: Session = Depends(get_db),
        current_user: UserModel = Depends(get_current_user),
):
    """
    Получить информацию о текущем пользователе
    """
    # Логируем просмотр собственного профиля
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="VIEW_PROFILE",
        entity_type="user",
        entity_id=current_user.id,
        details={
            "discord_username": current_user.discord_username,
            "minecraft_username": current_user.minecraft_username
        },
        request=request
    )

    return current_user


@router.get("/", response_model=List[UserPublic])
@with_role_check("view_users")
async def read_users(
        request: Request,
        db: Session = Depends(get_db),
        skip: int = 0,
        limit: int = 100,
        role: str = Query(None, description="Фильтр по роли (admin/police)"),
        active_only: bool = Query(True, description="Только активные пользователи"),
        current_user: UserModel = Depends(get_current_active_admin),
):
    """
    Получить список всех пользователей (только для администраторов)
    """
    if role:
        users = user_crud.get_users_by_role(db, role=role)
    elif active_only:
        users = user_crud.get_active_users(db, skip=skip, limit=limit)
    else:
        users = user_crud.get_multi(db, skip=skip, limit=limit)

    # Логируем просмотр списка пользователей
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="VIEW_LIST",
        entity_type="user",
        details={
            "count": len(users),
            "skip": skip,
            "limit": limit,
            "role_filter": role,
            "active_only": active_only
        },
        request=request
    )

    return users


@router.get("/statistics", response_model=UserStatistics)
@with_role_check("view_user_statistics")
async def get_user_statistics(
        request: Request,
        db: Session = Depends(get_db),
        current_user: UserModel = Depends(get_current_active_admin),
):
    """
    Получить статистику пользователей (только для администраторов)
    """
    stats = user_crud.get_statistics(db)

    # Логируем просмотр статистики
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="VIEW_STATISTICS",
        entity_type="user",
        details=stats,
        request=request
    )

    return stats


@router.put("/{user_id}", response_model=User)
@with_role_check("update_user")
async def update_user(
        request: Request,
        *,
        db: Session = Depends(get_db),
        user_id: int,
        user_in: UserUpdate,
        current_user: UserModel = Depends(get_current_active_admin),
):
    """
    Обновить пользователя (только для администраторов)
    """
    user = user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден",
        )

    # Сохраняем старые данные для логирования
    old_data = {
        "discord_username": user.discord_username,
        "minecraft_username": user.minecraft_username,
        "role": user.role,
        "is_active": user.is_active
    }

    user = user_crud.update(db, db_obj=user, obj_in=user_in)

    # Подготавливаем новые данные для логирования
    new_data = {
        "discord_username": user.discord_username,
        "minecraft_username": user.minecraft_username,
        "role": user.role,
        "is_active": user.is_active
    }

    # Логируем обновление пользователя
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="UPDATE",
        entity_type="user",
        entity_id=user.id,
        details={
            "old_data": old_data,
            "new_data": new_data,
            "updated_by": current_user.discord_username
        },
        request=request
    )

    return user


@router.get("/{user_id}", response_model=User)
@with_role_check("view_user")
async def read_user(
        request: Request,
        *,
        db: Session = Depends(get_db),
        user_id: int,
        current_user: UserModel = Depends(get_current_active_admin),
):
    """
    Получить пользователя по ID (только для администраторов)
    """
    user = user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден",
        )

    # Логируем просмотр конкретного пользователя
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="VIEW",
        entity_type="user",
        entity_id=user.id,
        details={
            "discord_username": user.discord_username,
            "minecraft_username": user.minecraft_username,
            "role": user.role,
            "viewed_by": current_user.discord_username
        },
        request=request
    )

    return user


@router.post("/{user_id}/deactivate", response_model=User)
@with_role_check("deactivate_user")
async def deactivate_user(
        request: Request,
        *,
        db: Session = Depends(get_db),
        user_id: int,
        current_user: UserModel = Depends(get_current_active_admin),
):
    """
    Деактивировать пользователя (только для администраторов)
    """
    user = user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден",
        )

    # Нельзя деактивировать самого себя
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя деактивировать самого себя",
        )

    user = user_crud.deactivate_user(db, user=user)

    # Логируем деактивацию пользователя
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="DEACTIVATE",
        entity_type="user",
        entity_id=user.id,
        details={
            "discord_username": user.discord_username,
            "minecraft_username": user.minecraft_username,
            "deactivated_by": current_user.discord_username
        },
        request=request
    )

    return user


@router.post("/{user_id}/activate", response_model=User)
@with_role_check("activate_user")
async def activate_user(
        request: Request,
        *,
        db: Session = Depends(get_db),
        user_id: int,
        current_user: UserModel = Depends(get_current_active_admin),
):
    """
    Активировать пользователя (только для администраторов)
    """
    user = user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден",
        )

    user = user_crud.activate_user(db, user=user)

    # Логируем активацию пользователя
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="ACTIVATE",
        entity_type="user",
        entity_id=user.id,
        details={
            "discord_username": user.discord_username,
            "minecraft_username": user.minecraft_username,
            "activated_by": current_user.discord_username
        },
        request=request
    )

    return user


@router.post("/{user_id}/check-roles", response_model=RoleCheckResult)
async def check_user_roles(
        request: Request,
        *,
        db: Session = Depends(get_db),
        user_id: int,
        current_user: UserModel = Depends(get_current_active_admin),
):
    """
    Принудительно проверить роли пользователя (только для администраторов)
    """
    user = user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден",
        )

    # Выполняем проверку ролей
    result = await role_checker_service.check_user_by_id(user_id)

    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ошибка при проверке ролей пользователя",
        )

    # Логируем принудительную проверку ролей
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="FORCE_ROLE_CHECK",
        entity_type="user",
        entity_id=user.id,
        details={
            "target_user": user.discord_username,
            "result": result,
            "triggered_by": current_user.discord_username
        },
        request=request
    )

    return RoleCheckResult(**result)


@router.get("/search/minecraft", response_model=List[UserPublic])
@with_role_check("search_users_minecraft")
async def search_users_by_minecraft(
        request: Request,
        *,
        db: Session = Depends(get_db),
        q: str = Query(..., min_length=3, description="Поисковый запрос"),
        current_user: UserModel = Depends(get_current_user),
):
    """
    Поиск пользователей по Minecraft никнейму
    """
    # Используем простой поиск через CRUD
    user = user_crud.get_by_minecraft_username(db, minecraft_username=q)
    users = [user] if user else []

    # Логируем поиск
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="SEARCH",
        entity_type="user",
        details={
            "search_query": q,
            "search_type": "minecraft_username",
            "results_count": len(users)
        },
        request=request
    )

    return users


@router.get("/search/discord", response_model=List[UserPublic])
@with_role_check("search_users_discord")
async def search_users_by_discord(
        request: Request,
        *,
        db: Session = Depends(get_db),
        q: str = Query(..., min_length=3, description="Поисковый запрос"),
        current_user: UserModel = Depends(get_current_user),
):
    """
    Поиск пользователей по Discord имени
    """
    # Простой поиск через SQL LIKE
    from sqlalchemy import or_
    users = db.query(UserModel).filter(
        or_(
            UserModel.discord_username.ilike(f"%{q}%"),
            UserModel.minecraft_username.ilike(f"%{q}%")
        )
    ).limit(10).all()

    # Логируем поиск
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="SEARCH",
        entity_type="user",
        details={
            "search_query": q,
            "search_type": "discord_username",
            "results_count": len(users)
        },
        request=request
    )

    return users