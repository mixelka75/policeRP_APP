# Docker запуск проекта

## Быстрый старт

Для запуска всего проекта (backend + frontend + database) выполните одну команду:

```bash
docker compose up
```

## Что включено

- **PostgreSQL** - база данных на порту 5432
- **Backend** - FastAPI приложение на порту 8000
- **Frontend** - React приложение на порту 3000

## Доступ к приложению

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Database: localhost:5432

## Учетные данные по умолчанию

- **Admin пользователь**: admin / admin123
- **Database**: user / password

## Дополнительные команды

```bash
# Запуск в фоновом режиме
docker compose up -d

# Остановка
docker compose down

# Пересборка образов
docker compose build

# Просмотр логов
docker compose logs -f

# Просмотр логов конкретного сервиса
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

## Разработка

Проект настроен для разработки с hot-reload:
- Изменения в `app/` автоматически перезагружают backend
- Изменения в `frontend/src/` автоматически перезагружают frontend

## Порты

- 3000 - Frontend (React)
- 8000 - Backend (FastAPI)
- 5432 - PostgreSQL