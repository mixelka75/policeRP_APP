from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_active_admin
from app.models.user import User
from app.schemas.user import RoleCheckResult
from app.services.role_checker import role_checker_service
from app.utils.logger import ActionLogger

router = APIRouter()


@router.post("/check-all")
async def trigger_role_check_all(
        request: Request,
        background_tasks: BackgroundTasks,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_active_admin),
):
    """
    Запустить проверку ролей для всех пользователей (только для администраторов)
    """
    # Логируем запуск массовой проверки ролей
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="TRIGGER_MASS_ROLE_CHECK",
        entity_type="system",
        details={
            "triggered_by": current_user.discord_username
        },
        request=request
    )

    # Запускаем принудительную проверку в фоне (игнорируем кеш)
    background_tasks.add_task(role_checker_service.check_all_users_roles, True)

    return {
        "message": "Проверка ролей для всех пользователей запущена в фоновом режиме",
        "triggered_by": current_user.discord_username
    }


@router.post("/check/{user_id}", response_model=RoleCheckResult)
async def check_specific_user_roles(
        request: Request,
        user_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_active_admin),
):
    """
    Проверить роли конкретного пользователя (только для администраторов)
    """
    # Проверяем, что пользователь существует
    from app.crud.user import user_crud
    target_user = user_crud.get(db, id=user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )

    # Выполняем принудительную проверку ролей (игнорируем кеш)
    result = await role_checker_service.check_user_by_id(user_id, force=True)

    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ошибка при проверке ролей пользователя"
        )

    # Логируем принудительную проверку ролей
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="TRIGGER_USER_ROLE_CHECK",
        entity_type="user",
        entity_id=user_id,
        details={
            "target_user": target_user.discord_username,
            "result": result,
            "triggered_by": current_user.discord_username
        },
        request=request
    )

    return RoleCheckResult(**result)


@router.get("/status")
def get_role_checker_status(
        request: Request,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_active_admin),
):
    """
    Получить статус сервиса проверки ролей (только для администраторов)
    """
    from app.core.config import settings

    status_info = {
        "service_running": role_checker_service.is_running,
        "check_interval_minutes": settings.ROLE_CHECK_INTERVAL,
        "last_cache_update": role_checker_service.cache_updated_at.isoformat() if role_checker_service.cache_updated_at else None,
        "guild_roles_cached": len(
            role_checker_service.guild_roles_cache) if role_checker_service.guild_roles_cache else 0
    }

    # Логируем просмотр статуса
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="VIEW_ROLE_CHECKER_STATUS",
        entity_type="system",
        details=status_info,
        request=request
    )

    return status_info


@router.post("/restart")
async def restart_role_checker(
        request: Request,
        background_tasks: BackgroundTasks,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_active_admin),
):
    """
    Перезапустить сервис проверки ролей (только для администраторов)
    """
    # Останавливаем сервис
    await role_checker_service.stop()

    # Запускаем сервис в фоне
    background_tasks.add_task(role_checker_service.start)

    # Логируем перезапуск сервиса
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="RESTART_ROLE_CHECKER",
        entity_type="system",
        details={
            "restarted_by": current_user.discord_username
        },
        request=request
    )

    return {
        "message": "Сервис проверки ролей перезапущен",
        "restarted_by": current_user.discord_username
    }


@router.get("/configuration")
def get_role_configuration(
        request: Request,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_active_admin),
):
    """
    Получить конфигурацию ролей (только для администраторов)
    """
    from app.core.config import settings

    config = {
        "discord_guild_id": settings.DISCORD_GUILD_ID,
        "police_role_name": settings.DISCORD_POLICE_ROLE_NAME,
        "admin_role_name": settings.DISCORD_ADMIN_ROLE_NAME,
        "role_check_interval": settings.ROLE_CHECK_INTERVAL,
        "spworlds_integration": {
            "enabled": bool(settings.SPWORLDS_MAP_ID and settings.SPWORLDS_MAP_TOKEN),
            "map_id": settings.SPWORLDS_MAP_ID,
            "api_url": settings.SPWORLDS_API_URL
        }
    }

    # Логируем просмотр конфигурации
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="VIEW_ROLE_CONFIGURATION",
        entity_type="system",
        details={
            "viewed_by": current_user.discord_username
        },
        request=request
    )

    return config


@router.get("/sync-issues")
def get_role_sync_issues(
        request: Request,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_active_admin),
):
    """
    Получить список пользователей с проблемами синхронизации ролей
    """
    from app.crud.user import user_crud
    from datetime import datetime, timedelta
    from app.core.config import settings

    # Получаем пользователей, которых давно не проверяли
    cutoff_time = datetime.utcnow() - timedelta(minutes=settings.ROLE_CHECK_INTERVAL * 2)

    users_with_issues = []
    all_users = user_crud.get_active_users(db)

    for user in all_users:
        issues = []

        # Проверяем, когда последний раз проверялись роли
        if not user.last_role_check or user.last_role_check < cutoff_time:
            issues.append("outdated_role_check")

        # Проверяем наличие Discord токенов
        if not user.discord_access_token:
            issues.append("missing_discord_token")

        # Проверяем истекшие токены
        if user.discord_expires_at and user.discord_expires_at < datetime.utcnow():
            issues.append("expired_discord_token")

        # Проверяем привязку к Minecraft
        if not user.minecraft_username:
            issues.append("missing_minecraft_data")

        if issues:
            users_with_issues.append({
                "user_id": user.id,
                "discord_username": user.discord_username,
                "minecraft_username": user.minecraft_username,
                "last_role_check": user.last_role_check.isoformat() if user.last_role_check else None,
                "issues": issues
            })

    # Логируем просмотр проблем синхронизации
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="VIEW_SYNC_ISSUES",
        entity_type="system",
        details={
            "users_with_issues_count": len(users_with_issues),
            "viewed_by": current_user.discord_username
        },
        request=request
    )

    return {
        "total_users": len(all_users),
        "users_with_issues": len(users_with_issues),
        "issues": users_with_issues,
        "last_check_cutoff": cutoff_time.isoformat()
    }