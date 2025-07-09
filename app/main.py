from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uvicorn

from app.core.config import settings
from app.core.database import engine, get_db
from app.api.v1 import api_router
from app.models import Base
from app.crud.user import user_crud
from app.schemas.user import UserCreate
from app.models.user import UserRole

# Создание таблиц в базе данных
Base.metadata.create_all(bind=engine)

# Создание приложения FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="""
    ## РП Сервер - Система управления

    Бэкэнд для управления паспортами жителей и штрафами на РП сервере.

    ### Функционал:
    * **Авторизация** - JWT токены для безопасности
    * **Управление пользователями** - Создание аккаунтов администраторов и полицейских
    * **Паспорта жителей** - CRUD операции с данными жителей
    * **Штрафы** - Выписка и управление штрафами
    * **Логирование** - Отслеживание всех действий пользователей

    ### Роли:
    * **Админ** - Полный доступ ко всем функциям + управление пользователями
    * **Полицейский** - Работа с паспортами и штрафами
    """,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене указать конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение API роутеров
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def root():
    """
    Корневой эндпоинт
    """
    return {
        "message": "РП Сервер API",
        "version": settings.VERSION,
        "docs": "/docs" if settings.DEBUG else "Документация отключена",
        "status": "running"
    }


@app.get("/health")
def health_check():
    """
    Проверка состояния сервиса
    """
    try:
        # Проверяем подключение к базе данных
        db = next(get_db())
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        db.close()
        
        return {
            "status": "healthy",
            "database": "connected",
            "version": settings.VERSION
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Ошибка подключения к БД: {str(e)}")


@app.on_event("startup")
async def startup_event():
    """
    События при запуске приложения
    """
    print(f"🚀 Запуск {settings.PROJECT_NAME} v{settings.VERSION}")
    
    # Создаем администратора по умолчанию, если его нет
    db = next(get_db())
    try:
        admin_user = user_crud.get_by_username(db, username=settings.ADMIN_USERNAME)
        if not admin_user:
            admin_create = UserCreate(
                username=settings.ADMIN_USERNAME,
                password=settings.ADMIN_PASSWORD,
                role=UserRole.ADMIN,
                is_active=True
            )
            admin_user = user_crud.create(db, obj_in=admin_create)
            print(f"✅ Создан администратор: {admin_user.username}")
        else:
            print(f"✅ Администратор уже существует: {admin_user.username}")
    except Exception as e:
        print(f"❌ Ошибка при создании администратора: {e}")
    finally:
        db.close()
    
    print("✅ Приложение готово к работе!")


@app.on_event("shutdown")
async def shutdown_event():
    """
    События при остановке приложения
    """
    print(f"🛑 Остановка {settings.PROJECT_NAME}")


if __name__ == "__main__":
    # Запуск сервера в режиме разработки
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info"
    )