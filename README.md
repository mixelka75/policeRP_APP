# РП Сервер - Система управления

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/your-repo/rp-server)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.11+-blue.svg)](https://python.org)
[![Node.js](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://docker.com)

> Современная веб-система для управления паспортами жителей и штрафами на РП сервере

## Функциональность

### Основные возможности:
- **Авторизация**: JWT токены для безопасного доступа
- **Управление пользователями**: Создание аккаунтов администраторов и полицейских
- **Паспорта жителей**: CRUD операции с данными жителей
- **Штрафы**: Выписка и управление штрафами
- **Логирование**: Отслеживание всех действий пользователей

### Роли пользователей:
- **Администратор**: Полный доступ + управление пользователями и просмотр логов
- **Полицейский**: Работа с паспортами и штрафами

## 🚀 Быстрый старт

### Для разработки (SQLite)

```bash
# 1. Клонируем и переходим в директорию
git clone <repository-url>
cd rp_server_backend

# 2. Создаем виртуальное окружение
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или venv\Scripts\activate  # Windows

# 3. Устанавливаем зависимости
pip install -r requirements.txt

# 4. Настраиваем окружение
cp .env.example .env

# 5. Запускаем сервер
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Проверка работы

```bash
# Проверка API
curl http://localhost:8000/
curl http://localhost:8000/health

# Авторизация (admin/admin123)
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"
```

**Доступы:**
- 📖 **API документация:** http://localhost:8000/docs
- 🔄 **Redoc:** http://localhost:8000/redoc
- 💚 **Статус:** http://localhost:8000/health
- 👤 **Логин:** admin / admin123

## 📋 Среды развертывания

| Среда | Документация | База данных | Безопасность |
|-------|-------------|-------------|--------------|
| 🔧 **Разработка** | [DEPLOYMENT.md](DEPLOYMENT.md#разработка-development) | SQLite | Базовая |
| 🧪 **Тестирование** | [DEPLOYMENT.md](DEPLOYMENT.md#тестирование-testing) | SQLite | Средняя |
| 🚀 **Продакшен** | [DEPLOYMENT.md](DEPLOYMENT.md#продакшен-production) | PostgreSQL | Высокая |
| 🐳 **Docker** | [DEPLOYMENT.md](DEPLOYMENT.md#docker-развертывание) | PostgreSQL | Высокая |

> 📚 **Полная документация по развертыванию:** [DEPLOYMENT.md](DEPLOYMENT.md)

## Использование API

### Авторизация
По умолчанию создается администратор с данными из `.env` файла.

1. Получите токен:
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"
```

2. Используйте токен в заголовках:
```bash
curl -X GET "http://localhost:8000/api/v1/users/me" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Основные эндпоинты:

#### Пользователи (только админ):
- `GET /api/v1/users/` - Список пользователей
- `POST /api/v1/users/` - Создать пользователя
- `GET /api/v1/users/{id}` - Получить пользователя
- `PUT /api/v1/users/{id}` - Обновить пользователя
- `DELETE /api/v1/users/{id}` - Удалить пользователя

#### Паспорта:
- `GET /api/v1/passports/` - Список паспортов
- `POST /api/v1/passports/` - Создать паспорт
- `GET /api/v1/passports/{id}` - Получить паспорт
- `PUT /api/v1/passports/{id}` - Обновить паспорт
- `DELETE /api/v1/passports/{id}` - Удалить паспорт

#### Штрафы:
- `GET /api/v1/fines/` - Список штрафов
- `POST /api/v1/fines/` - Создать штраф
- `GET /api/v1/fines/{id}` - Получить штраф
- `PUT /api/v1/fines/{id}` - Обновить штраф
- `DELETE /api/v1/fines/{id}` - Удалить штраф

#### Логи (только админ):
- `GET /api/v1/logs/` - Список логов
- `GET /api/v1/logs/recent` - Недавние логи
- `GET /api/v1/logs/my` - Мои логи

## Структура проекта

```
rp_server_backend/
├── app/
│   ├── api/v1/          # API эндпоинты
│   ├── core/            # Настройки и конфигурация
│   ├── crud/            # CRUD операции
│   ├── models/          # SQLAlchemy модели
│   ├── schemas/         # Pydantic схемы
│   ├── utils/           # Утилиты
│   └── main.py          # Главное приложение
├── alembic/             # Миграции БД
├── requirements.txt     # Зависимости
├── .env.example        # Пример переменных окружения
└── README.md           # Документация
```

## Безопасность

### Аутентификация и авторизация:
- JWT токены для авторизации
- Хеширование паролей с bcrypt
- Проверка ролей для доступа к эндпоинтам

### Логирование:
- Все действия пользователей записываются в базу данных
- Сохранение IP адресов
- Детальная информация об изменениях

## Производственный запуск

### 1. Настройка переменных окружения
```env
DEBUG=False
DATABASE_URL=postgresql://user:password@db-server:5432/rp_server_db
SECRET_KEY=super-secret-production-key
```

### 2. Запуск с Gunicorn
```bash
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### 3. Настройка прокси-сервера (Nginx)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## Разработка

### Создание новой миграции:
```bash
alembic revision --autogenerate -m "Описание изменений"
```

### Применение миграций:
```bash
alembic upgrade head
```

### Откат миграций:
```bash
alembic downgrade -1
```

### Запуск тестов:
```bash
pytest  # После создания тестов
```

## Поддержка

При возникновении проблем:
1. Проверьте логи сервера
2. Убедитесь в правильности настроек .env
3. Проверьте подключение к базе данных
4. Обратитесь к API документации по адресу `/docs`

## Версия
v1.0.0