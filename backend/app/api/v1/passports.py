from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_police_or_admin, get_current_user_with_minecraft, get_current_user
from app.core.decorators import with_role_check
from app.crud.passport import passport_crud
from app.schemas.passport import (
    Passport,
    PassportCreate,
    PassportUpdate,
    PassportInfo,
    PassportEmergencyUpdate,
    PassportEmergencyResponse,
    PassportSkinResponse,
    PlayerSkinResponse
)
from app.models.user import User
from app.utils.logger import ActionLogger
from app.clients.spworlds import spworlds_client

router = APIRouter()


@router.get("/", response_model=List[Passport])
@with_role_check("view_passports")
async def read_passports(
        request: Request,
        db: Session = Depends(get_db),
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = Query(None, description="Поиск по имени, фамилии, никнейму или Discord ID"),
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
    elif search:
        # Простой поиск по всем текстовым полям
        from sqlalchemy import or_
        from app.models.passport import Passport as PassportModel
        passports = db.query(PassportModel).filter(
            or_(
                PassportModel.first_name.ilike(f"%{search}%"),
                PassportModel.last_name.ilike(f"%{search}%"),
                PassportModel.nickname.ilike(f"%{search}%"),
                PassportModel.discord_id.ilike(f"%{search}%"),
                PassportModel.city.ilike(f"%{search}%")
            )
        ).offset(skip).limit(limit).all()
    else:
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
            "search": search,
            "city_filter": city,
            "emergency_only": emergency_only,
            "minecraft_username": current_user.minecraft_username
        },
        request=request
    )

    return passports


@router.get("/me", response_model=Passport)
async def get_my_passport(
        request: Request,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    """
    Получить свой паспорт (для обычных пользователей с паспортом)
    """
    passport = passport_crud.get_by_discord_id(db, discord_id=str(current_user.discord_id))
    if not passport:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="У вас нет паспорта в системе",
        )

    # Логируем просмотр собственного паспорта
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="VIEW_OWN_PASSPORT",
        entity_type="passport",
        entity_id=passport.id,
        details={
            "nickname": passport.nickname,
            "city": passport.city,
            "violations_count": passport.violations_count,
            "is_emergency": passport.is_emergency
        },
        request=request
    )

    return passport


@router.get("/emergency", response_model=List[Passport])
def read_emergency_passports(
        request: Request,
        db: Session = Depends(get_db),
        skip: int = 0,
        limit: int = 100,
        current_user: User = Depends(get_current_police_or_admin),
):
    """
    Получить список паспортов в ЧС
    """
    passports = passport_crud.get_emergency_passports(db, skip=skip, limit=limit)

    # Логируем просмотр ЧС списка
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="VIEW_EMERGENCY_LIST",
        entity_type="passport",
        details={
            "count": len(passports),
            "skip": skip,
            "limit": limit,
            "officer": current_user.minecraft_username
        },
        request=request
    )

    return passports


@router.post("/", response_model=Passport)
@with_role_check("create_passport")
async def create_passport(
        request: Request,
        *,
        db: Session = Depends(get_db),
        passport_in: PassportCreate,
        current_user: User = Depends(get_current_police_or_admin),
):
    """
    Создать новый паспорт
    """
    # Проверяем, что Discord ID уникален
    if passport_crud.check_discord_id_exists(db, discord_id=passport_in.discord_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Паспорт с таким Discord ID уже существует",
        )

    passport = await passport_crud.create(db, obj_in=passport_in)

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
            "city": passport.city,
            "violations_count": passport.violations_count,
            "is_emergency": passport.is_emergency,
            "officer": current_user.minecraft_username
        },
        request=request
    )

    return passport


@router.get("/search/nickname/{nickname}", response_model=Passport)
def find_passport_by_nickname(
        request: Request,
        *,
        db: Session = Depends(get_db),
        nickname: str,
        current_user: User = Depends(get_current_police_or_admin),
):
    """
    Найти паспорт по никнейму
    """
    passport = passport_crud.get_by_nickname(db, nickname=nickname)
    if not passport:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Паспорт с таким никнеймом не найден",
        )

    # Логируем поиск по никнейму
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="SEARCH_BY_NICKNAME",
        entity_type="passport",
        entity_id=passport.id,
        details={
            "search_nickname": nickname,
            "found_passport": passport.nickname,
            "officer": current_user.minecraft_username
        },
        request=request
    )

    return passport


@router.get("/search/discord/{discord_id}", response_model=Passport)
def find_passport_by_discord_id(
        request: Request,
        *,
        db: Session = Depends(get_db),
        discord_id: str,
        current_user: User = Depends(get_current_police_or_admin),
):
    """
    Найти паспорт по Discord ID
    """
    passport = passport_crud.get_by_discord_id(db, discord_id=discord_id)
    if not passport:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Паспорт с таким Discord ID не найден",
        )

    # Логируем поиск по Discord ID
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="SEARCH_BY_DISCORD_ID",
        entity_type="passport",
        entity_id=passport.id,
        details={
            "search_discord_id": discord_id,
            "found_passport": passport.discord_id,
            "nickname": passport.nickname,
            "officer": current_user.minecraft_username
        },
        request=request
    )

    return passport


@router.put("/{passport_id}", response_model=Passport)
@with_role_check("update_passport")
async def update_passport(
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

    # Проверяем уникальность Discord ID при изменении
    if passport_in.discord_id and passport_in.discord_id != passport.discord_id:
        if passport_crud.check_discord_id_exists(db, discord_id=passport_in.discord_id, exclude_id=passport_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Паспорт с таким Discord ID уже существует",
            )

    # Сохраняем старые данные для логов
    old_data = {
        "discord_id": passport.discord_id,
        "nickname": passport.nickname,
        "first_name": passport.first_name,
        "last_name": passport.last_name,
        "city": passport.city,
        "age": passport.age,
        "gender": passport.gender
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
@with_role_check("update_passport_emergency")
async def toggle_emergency_status(
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
            "action": action,
            "officer": current_user.minecraft_username
        },
        request=request
    )

    return PassportEmergencyResponse(
        id=passport.id,
        nickname=passport.nickname,
        is_emergency=passport.is_emergency,
        message=message
    )


@router.get("/{passport_id}/skin", response_model=PassportSkinResponse)
async def get_passport_skin(
        request: Request,
        *,
        db: Session = Depends(get_db),
        passport_id: int,
        current_user: User = Depends(get_current_police_or_admin),
):
    """
    Получить URL скина (головы) игрока по ID паспорта
    """
    passport = passport_crud.get(db, id=passport_id)
    if not passport:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Паспорт не найден",
        )

    # Если UUID уже есть в паспорте, используем его
    if passport.uuid:
        skin_url = await spworlds_client.get_player_skin_url(passport.uuid)
        uuid_to_use = passport.uuid
    else:
        # Иначе получаем данные пользователя из SP-Worlds по Discord ID
        user_data = await spworlds_client.find_user(passport.discord_id)
        
        if not user_data or not user_data.get("uuid"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="UUID игрока не найден в SP-Worlds",
            )

        uuid_to_use = user_data["uuid"]
        # Получаем URL скина
        skin_url = await spworlds_client.get_player_skin_url(uuid_to_use)
    
    if not skin_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Скин игрока недоступен",
        )

    # Логируем запрос скина
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="GET_SKIN",
        entity_type="passport",
        entity_id=passport.id,
        details={
            "discord_id": passport.discord_id,
            "nickname": passport.nickname,
            "uuid": uuid_to_use,
            "skin_url": skin_url,
            "officer": current_user.minecraft_username
        },
        request=request
    )

    return PassportSkinResponse(
        passport_id=passport.id,
        nickname=passport.nickname or "Unknown",
        uuid=uuid_to_use,
        skin_url=skin_url
    )


@router.get("/skin/by-discord/{discord_id}", response_model=PlayerSkinResponse)
async def get_skin_by_discord_id(
        request: Request,
        *,
        db: Session = Depends(get_db),
        discord_id: str,
        current_user: User = Depends(get_current_police_or_admin),
):
    """
    Получить URL скина (головы) игрока по Discord ID
    """
    # Получаем данные пользователя из SP-Worlds
    user_data = await spworlds_client.find_user(discord_id)
    
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден в SP-Worlds",
        )
    
    if not user_data.get("uuid"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="UUID игрока не найден",
        )

    # Получаем URL скина
    skin_url = await spworlds_client.get_player_skin_url(user_data["uuid"])
    
    if not skin_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Скин игрока недоступен",
        )

    # Логируем запрос скина
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="GET_SKIN_BY_DISCORD",
        entity_type="user",
        details={
            "discord_id": discord_id,
            "username": user_data.get("username"),
            "uuid": user_data["uuid"],
            "skin_url": skin_url,
            "officer": current_user.minecraft_username
        },
        request=request
    )

    return PlayerSkinResponse(
        discord_id=discord_id,
        username=user_data.get("username"),
        uuid=user_data["uuid"],
        skin_url=skin_url
    )


@router.delete("/{passport_id}", response_model=Passport)
@with_role_check("delete_passport")
async def delete_passport(
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
        "city": passport.city,
        "age": passport.age,
        "gender": passport.gender,
        "violations_count": passport.violations_count
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


@router.get("/statistics/overview")
def get_passports_statistics(
        request: Request,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_police_or_admin),
):
    """
    Получить статистику по паспортам
    """
    from sqlalchemy import func
    from app.models.passport import Passport as PassportModel

    # Общая статистика
    total_passports = db.query(func.count(PassportModel.id)).scalar()
    emergency_count = db.query(func.count(PassportModel.id)).filter(PassportModel.is_emergency == True).scalar()

    # Статистика по городам
    cities_stats = db.query(
        PassportModel.city,
        func.count(PassportModel.id).label('count')
    ).group_by(PassportModel.city).all()

    # Статистика по полу
    gender_stats = db.query(
        PassportModel.gender,
        func.count(PassportModel.id).label('count')
    ).group_by(PassportModel.gender).all()

    # Статистика по возрасту
    avg_age = db.query(func.avg(PassportModel.age)).scalar()

    # Статистика по нарушениям
    total_violations = db.query(func.sum(PassportModel.violations_count)).scalar()

    stats = {
        "total_passports": total_passports,
        "emergency_count": emergency_count,
        "cities": [{"city": city, "count": count} for city, count in cities_stats],
        "gender_distribution": [{"gender": gender, "count": count} for gender, count in gender_stats],
        "average_age": float(avg_age) if avg_age else 0,
        "total_violations": total_violations or 0
    }

    # Логируем просмотр статистики
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="VIEW_STATISTICS",
        entity_type="passport",
        details={
            "stats": stats,
            "officer": current_user.minecraft_username
        },
        request=request
    )

    return stats


@router.get("/avatar/by-nickname/{nickname}", response_model=PlayerSkinResponse)
async def get_avatar_by_nickname(
        request: Request,
        *,
        db: Session = Depends(get_db),
        nickname: str,
        current_user: User = Depends(get_current_police_or_admin),
):
    """
    Получить URL аватарки (головы) игрока по Minecraft nickname
    """
    # Получаем данные пользователя из SP-Worlds по nickname
    user_data = await spworlds_client.find_user_by_nickname(nickname)
    
    if not user_data or not user_data.get("uuid"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="UUID игрока не найден в SP-Worlds",
        )
    
    # Получаем URL скина
    skin_url = await spworlds_client.get_player_skin_url(user_data["uuid"])
    
    if not skin_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Скин игрока недоступен",
        )
    
    # Логируем запрос аватарки
    ActionLogger.log_action(
        db=db,
        user=current_user,
        action="GET_AVATAR_BY_NICKNAME",
        entity_type="avatar",
        details={
            "nickname": nickname,
            "uuid": user_data["uuid"],
            "skin_url": skin_url,
            "officer": current_user.minecraft_username
        },
        request=request
    )
    
    return PlayerSkinResponse(
        discord_id="",  # Not available when searching by nickname
        username=nickname,
        uuid=user_data["uuid"],
        skin_url=skin_url
    )