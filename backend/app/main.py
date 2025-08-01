import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uvicorn

from app.core.config import settings
from app.core.database import engine, get_db
from app.api.v1 import api_router
from app.models import Base
from app.clients import discord_client, spworlds_client
from app.services import role_checker_service

# Создание таблиц в базе данных
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Управление жизненным циклом приложения
    """
    # Startup
    print(f"🚀 Запуск {settings.PROJECT_NAME} v{settings.VERSION}")

    # Проверяем соединение с внешними сервисами
    try:
        spworlds_ping = await spworlds_client.ping()
        print(f"✅ SP-Worlds API: {'доступен' if spworlds_ping else 'недоступен'}")
    except Exception as e:
        print(f"❌ SP-Worlds API: ошибка - {e}")

    # Запускаем сервис проверки ролей
    if settings.ROLE_CHECK_INTERVAL > 0:
        role_checker_task = asyncio.create_task(role_checker_service.start())
        print(f"✅ Сервис проверки ролей запущен (интервал: {settings.ROLE_CHECK_INTERVAL} мин)")
    else:
        role_checker_task = None
        print("⚠️ Сервис проверки ролей отключен")

    print("✅ Приложение готово к работе!")

    yield

    # Shutdown
    print(f"🛑 Остановка {settings.PROJECT_NAME}")

    # Останавливаем сервис проверки ролей
    if role_checker_task:
        await role_checker_service.stop()
        role_checker_task.cancel()
        try:
            await role_checker_task
        except asyncio.CancelledError:
            pass
        print("✅ Сервис проверки ролей остановлен")

    # Закрываем HTTP клиенты
    await discord_client.close()
    await spworlds_client.close()
    print("✅ HTTP клиенты закрыты")


# Создание приложения FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    description="""
    ## РП Сервер - Система управления

    Бэкэнд для управления паспортами жителей и штрафами на РП сервере.
    Авторизация через Discord с проверкой ролей и интеграцией с SP-Worlds API.

    ### Функционал:
    * **Discord авторизация** - OAuth2 авторизация через Discord
    * **Автоматическая проверка ролей** - Периодическая синхронизация ролей с Discord сервером
    * **SP-Worlds интеграция** - Получение Minecraft никнеймов через SP-Worlds API
    * **Управление паспортами** - CRUD операции с данными жителей
    * **Система штрафов** - Выписка и управление штрафами
    * **Детальное логирование** - Отслеживание всех действий пользователей

    ### Роли:
    * **Администратор** - Полный доступ + управление пользователями (роль Discord: "{admin_role}")
    * **Полицейский** - Работа с паспортами и штрафами (роль Discord: "{police_role}")

    ### Авторизация:
    1. Перейдите на `/api/v1/auth/discord/login` для получения Discord OAuth URL
    2. Авторизуйтесь через Discord
    3. Система автоматически проверит ваши роли на сервере
    4. При успешной авторизации вы получите JWT токен
    """.format(
        admin_role=settings.DISCORD_ADMIN_ROLE_NAME,
        police_role=settings.DISCORD_POLICE_ROLE_NAME
    ),
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Middleware для пропуска предупреждения ngrok
@app.middleware("http")
async def add_ngrok_header(request: Request, call_next):
    response = await call_next(request)
    response.headers["ngrok-skip-browser-warning"] = "true"
    return response

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение API роутеров
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def root(response: Response):
    """
    Корневой эндпоинт
    """
    response.headers["ngrok-skip-browser-warning"] = "true"
    return {
        "message": "РП Сервер API",
        "version": settings.VERSION,
        "docs": "/docs" if settings.DEBUG else "Документация отключена",
        "discord_auth": f"/api/v1/auth/discord/login",
        "status": "running",
        "features": {
            "discord_auth": True,
            "spworlds_integration": True,
            "role_checking": settings.ROLE_CHECK_INTERVAL > 0,
            "role_check_interval": f"{settings.ROLE_CHECK_INTERVAL} минут" if settings.ROLE_CHECK_INTERVAL > 0 else "отключено"
        }
    }


@app.get("/health")
async def health_check(response: Response):
    """
    Проверка состояния сервиса
    """
    response.headers["ngrok-skip-browser-warning"] = "true"
    try:
        # Проверяем подключение к базе данных
        db = next(get_db())
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        db.close()

        # Проверяем внешние сервисы
        spworlds_status = await spworlds_client.ping()

        return {
            "status": "healthy",
            "database": "connected",
            "spworlds_api": "connected" if spworlds_status else "disconnected",
            "discord_integration": "enabled",
            "role_checker": "running" if role_checker_service.is_running else "stopped",
            "version": settings.VERSION
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Ошибка сервиса: {str(e)}")


@app.get("/api/v1/auth/discord/status")
async def discord_status():
    """
    Проверка статуса Discord интеграции
    """
    return {
        "discord_configured": bool(settings.DISCORD_CLIENT_ID and settings.DISCORD_CLIENT_SECRET),
        "guild_configured": bool(settings.DISCORD_GUILD_ID),
        "roles_configured": bool(settings.DISCORD_ADMIN_ROLE_NAME and settings.DISCORD_POLICE_ROLE_NAME),
        "spworlds_configured": bool(settings.SPWORLDS_MAP_ID and settings.SPWORLDS_MAP_TOKEN),
        "role_check_interval": settings.ROLE_CHECK_INTERVAL,
        "redirect_uri": settings.DISCORD_REDIRECT_URI
    }


if __name__ == "__main__":
    # Запуск сервера в режиме разработки
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info",
    )