from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_active_admin, get_current_user
from app.crud.user import user_crud
from app.schemas.user import User, UserCreate, UserUpdate
from app.models.user import User as UserModel
from app.utils.logger import ActionLogger

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
        details={"username": current_user.username},
        request=request
    )

    return current_user


@router.get("/", response_model=List[User])
def read_users(
        request: Request,
        db: Session = Depends(get_db),
        skip: int = 0,
        limit: int = 100,
        current_user: UserModel = Depends(get_current_active_admin),
):
    """
    Получить список всех пользователей (только для администраторов)
    """
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
            "limit": limit
        },
        request=request
    )

    return users


@router.post("/", response_model=User)
def create_user(
        request: Request,
        *,
        db: Session = Depends(get_db),
        user_in: UserCreate,
        current_user: UserModel = Depends(get_current_active_admin),
):
    """
    Создать нового пользователя (только для администраторов)
    """
    # Проверяем, что пользователь с таким именем не существует
    user = user_crud.get_by_username(db, username=user_in.username)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким именем уже существует",
        )

    user = user_crud.create(db, obj_in=user_in)

    # Логируем создание пользователя
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="CREATE",
        entity_type="user",
        entity_id=user.id,
        details={
            "username": user.username,
            "role": user.role,
            "is_active": user.is_active,
            "created_by": current_user.username
        },
        request=request
    )

    return user


@router.put("/{user_id}", response_model=User)
def update_user(
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

    # Проверяем, что новое имя пользователя не занято
    if user_in.username and user_in.username != user.username:
        existing_user = user_crud.get_by_username(db, username=user_in.username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь с таким именем уже существует",
            )

    # Сохраняем старые данные для логирования
    old_data = {
        "username": user.username,
        "role": user.role,
        "is_active": user.is_active
    }

    user = user_crud.update(db, db_obj=user, obj_in=user_in)

    # Подготавливаем новые данные для логирования
    new_data = {
        "username": user.username,
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
            "updated_by": current_user.username
        },
        request=request
    )

    return user


@router.get("/{user_id}", response_model=User)
def read_user(
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
            "username": user.username,
            "role": user.role,
            "viewed_by": current_user.username
        },
        request=request
    )

    return user


@router.delete("/{user_id}", response_model=User)
def delete_user(
        request: Request,
        *,
        db: Session = Depends(get_db),
        user_id: int,
        current_user: UserModel = Depends(get_current_active_admin),
):
    """
    Удалить пользователя (только для администраторов)
    """
    user = user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден",
        )

    # Нельзя удалить самого себя
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя удалить самого себя",
        )

    # Сохраняем данные пользователя для логирования
    user_data = {
        "username": user.username,
        "role": user.role,
        "is_active": user.is_active
    }

    user = user_crud.remove(db, id=user_id)

    # Логируем удаление пользователя
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="DELETE",
        entity_type="user",
        entity_id=user_id,
        details={
            "deleted_user_data": user_data,
            "deleted_by": current_user.username
        },
        request=request
    )

    return user