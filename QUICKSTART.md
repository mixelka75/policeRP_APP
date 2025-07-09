# Быстрый старт

## Запуск без базы данных (для тестирования)

1. **Установите зависимости:**
```bash
pip install -r requirements.txt
```

2. **Создайте .env файл:**
```bash
cp .env.example .env
```

3. **Запустите сервер:**
```bash
python app/main.py
```

Откройте в браузере: http://localhost:8000/docs

## Полная настройка с PostgreSQL

### 1. Установка PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
Скачайте с https://www.postgresql.org/download/windows/

### 2. Создание базы данных

```sql
-- Войдите в PostgreSQL
sudo -u postgres psql

-- Создайте базу данных и пользователя
CREATE DATABASE rp_server_db;
CREATE USER rp_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE rp_server_db TO rp_user;
\q
```

### 3. Настройка окружения

Отредактируйте `.env`:
```env
DATABASE_URL=postgresql://rp_user:your_password@localhost:5432/rp_server_db
SECRET_KEY=your-very-secret-key-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### 4. Миграции и запуск

```bash
# Применить миграции
alembic upgrade head

# Запустить сервер
python app/main.py
```

## Тестирование API

### Авторизация

```bash
# Получить токен
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"
```

### Создание паспорта

```bash
curl -X POST "http://localhost:8000/api/v1/passports/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Иван",
    "last_name": "Петров", 
    "nickname": "ivan_petrov",
    "age": 25,
    "gender": "male"
  }'
```

### Создание штрафа

```bash
curl -X POST "http://localhost:8000/api/v1/fines/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "passport_id": 1,
    "article": "Превышение скорости",
    "amount": 5000,
    "description": "Превышение на 20 км/ч"
  }'
```

## Устранение проблем

### Проблема: ModuleNotFoundError

```bash
# Убедитесь что установлены зависимости
pip install -r requirements.txt

# Или установите вручную
pip install fastapi uvicorn sqlalchemy psycopg2-binary
```

### Проблема: Подключение к БД

1. Проверьте что PostgreSQL запущен
2. Проверьте настройки в .env файле
3. Проверьте права пользователя БД

### Проблема: Alembic ошибки

```bash
# Удалите версии и пересоздайте
rm -rf alembic/versions/*
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

## Готово! 🎉

Теперь можете использовать:
- Документация: http://localhost:8000/docs
- Статус: http://localhost:8000/health
- API: http://localhost:8000/api/v1/