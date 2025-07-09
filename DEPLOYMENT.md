# Развертывание РП Сервер Backend

## 📋 Содержание

1. [Разработка (Development)](#разработка-development)
2. [Тестирование (Testing)](#тестирование-testing)
3. [Продакшен (Production)](#продакшен-production)
4. [Docker развертывание](#docker-развертывание)
5. [CI/CD Pipeline](#cicd-pipeline)

---

## 🔧 Разработка (Development)

### Быстрый старт

```bash
# 1. Клонируем проект
git clone <your-repo-url>
cd rp_server_backend

# 2. Создаем виртуальное окружение
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или venv\Scripts\activate  # Windows

# 3. Устанавливаем зависимости
pip install -r requirements.txt

# 3. Переходим в папку backend
cd backend

# 4. Копируем настройки
cp .env.example .env

# 5. Запускаем сервер
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Настройки для разработки (.env)

```env
# База данных (SQLite для разработки)
DATABASE_URL=sqlite:///./dev_database.db

# Безопасность
SECRET_KEY=dev-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Приложение
PROJECT_NAME="RP Server Backend"
DEBUG=True

# Администратор
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### Проверка работы

```bash
# Проверка API
curl http://localhost:8000/
curl http://localhost:8000/health

# Авторизация
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"

# Документация
open http://localhost:8000/docs
```

---

## 🧪 Тестирование (Testing)

### Настройка тестовой среды

```bash
# 1. Создаем тестовую базу данных
cp .env.example .env.test

# 2. Настраиваем .env.test
DATABASE_URL=sqlite:///./test_database.db
DEBUG=True
SECRET_KEY=test-secret-key
```

### Запуск тестов

```bash
# Установка тестовых зависимостей
pip install pytest pytest-asyncio httpx

# Запуск всех тестов
pytest

# Запуск с покрытием кода
pytest --cov=app tests/

# Запуск конкретного теста
pytest tests/test_auth.py -v
```

### Пример тестового файла

```python
# tests/test_auth.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_login():
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin", "password": "admin123"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
```

### Тестирование с помощью curl

```bash
# Установка переменных
export BASE_URL="http://localhost:8000"
export TOKEN=""

# Получение токена
TOKEN=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123" | jq -r .access_token)

# Создание паспорта
curl -X POST "$BASE_URL/api/v1/passports/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Иван",
    "last_name": "Петров",
    "nickname": "ivan_petrov",
    "age": 25,
    "gender": "male"
  }'

# Создание штрафа
curl -X POST "$BASE_URL/api/v1/fines/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "passport_id": 1,
    "article": "Превышение скорости",
    "amount": 5000,
    "description": "Превышение на 20 км/ч"
  }'
```

---

## 🚀 Продакшен (Production)

### Подготовка сервера (Ubuntu 20.04+)

```bash
# 1. Обновляем систему
sudo apt update && sudo apt upgrade -y

# 2. Устанавливаем зависимости
sudo apt install python3 python3-pip python3-venv postgresql postgresql-contrib nginx supervisor git -y

# 3. Создаем пользователя для приложения
sudo adduser --system --group --home /opt/rp_server rp_server
```

### Настройка PostgreSQL

```bash
# Входим в PostgreSQL
sudo -u postgres psql

# Создаем базу данных и пользователя
CREATE DATABASE rp_server_prod;
CREATE USER rp_prod_user WITH PASSWORD 'super_secure_password_123';
GRANT ALL PRIVILEGES ON DATABASE rp_server_prod TO rp_prod_user;
ALTER USER rp_prod_user CREATEDB;
\q
```

### Развертывание приложения

```bash
# 1. Переходим в директорию приложения
sudo -u rp_server -s
cd /opt/rp_server

# 2. Клонируем проект
git clone <your-repo-url> backend
cd backend

# 3. Создаем виртуальное окружение
python3 -m venv venv
source venv/bin/activate

# 4. Устанавливаем зависимости
pip install -r requirements.txt
pip install gunicorn

# 5. Создаем продакшен настройки
cp .env.example .env.prod
```

### Продакшен настройки (.env.prod)

```env
# База данных
DATABASE_URL=postgresql://rp_prod_user:super_secure_password_123@localhost:5432/rp_server_prod

# Безопасность
SECRET_KEY=super-long-random-secret-key-for-production-min-32-chars
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Приложение
PROJECT_NAME="RP Server Backend"
DEBUG=False

# Администратор
ADMIN_USERNAME=admin
ADMIN_PASSWORD=super_secure_admin_password_123
```

### Применение миграций

```bash
# Копируем настройки
cp .env.prod .env

# Применяем миграции
source venv/bin/activate
alembic upgrade head
```

### Настройка Supervisor

```bash
# Создаем конфигурацию supervisor
sudo tee /etc/supervisor/conf.d/rp_server.conf > /dev/null <<EOF
[program:rp_server]
command=/opt/rp_server/backend/venv/bin/gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 127.0.0.1:8000
directory=/opt/rp_server/backend
environment=PATH="/opt/rp_server/backend/venv/bin"
user=rp_server
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/rp_server.log
stdout_logfile_maxbytes=50MB
stdout_logfile_backups=10
EOF

# Обновляем supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start rp_server
```

### Настройка Nginx

```bash
# Создаем конфигурацию nginx
sudo tee /etc/nginx/sites-available/rp_server > /dev/null <<EOF
server {
    listen 80;
    server_name your-domain.com;  # Замените на ваш домен

    client_max_body_size 4G;

    access_log /var/log/nginx/rp_server_access.log;
    error_log /var/log/nginx/rp_server_error.log;

    location / {
        proxy_set_header Host \$http_host;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_redirect off;
        proxy_buffering off;
        proxy_pass http://127.0.0.1:8000;
    }

    location /health {
        proxy_pass http://127.0.0.1:8000/health;
        access_log off;
    }
}
EOF

# Активируем сайт
sudo ln -s /etc/nginx/sites-available/rp_server /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### SSL сертификат (Let's Encrypt)

```bash
# Устанавливаем certbot
sudo apt install certbot python3-certbot-nginx -y

# Получаем SSL сертификат
sudo certbot --nginx -d your-domain.com

# Настраиваем автообновление
sudo crontab -e
# Добавляем: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Настройка брандмауэра

```bash
# Настраиваем UFW
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

---

## 🐳 Docker развертывание

### Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Устанавливаем зависимости
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем код
COPY . .

# Создаем пользователя
RUN useradd --create-home --shell /bin/bash app
RUN chown -R app:app /app
USER app

EXPOSE 8000

CMD ["gunicorn", "app.main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: rp_server_db
      POSTGRES_USER: rp_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  api:
    build: .
    environment:
      DATABASE_URL: postgresql://rp_user:secure_password@db:5432/rp_server_db
      SECRET_KEY: super-secret-production-key
      DEBUG: "false"
      ADMIN_USERNAME: admin
      ADMIN_PASSWORD: secure_admin_password
    ports:
      - "8000:8000"
    depends_on:
      - db
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api
    restart: unless-stopped

volumes:
  postgres_data:
```

### Запуск Docker

```bash
# Развертывание
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down

# Перезапуск
docker-compose restart
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions (.github/workflows/deploy.yml)

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: 3.11
    
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        pip install pytest
    
    - name: Run tests
      run: pytest

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.PRIVATE_KEY }}
        script: |
          cd /opt/rp_server/backend
          git pull origin main
          source venv/bin/activate
          pip install -r requirements.txt
          alembic upgrade head
          sudo supervisorctl restart rp_server
```

---

## 🔧 Управление и мониторинг

### Полезные команды

```bash
# Просмотр логов
sudo tail -f /var/log/rp_server.log
sudo tail -f /var/log/nginx/rp_server_access.log

# Управление сервисом
sudo supervisorctl status rp_server
sudo supervisorctl restart rp_server
sudo supervisorctl stop rp_server

# Проверка состояния
curl http://localhost:8000/health

# Резервное копирование БД
sudo -u postgres pg_dump rp_server_prod > backup_$(date +%Y%m%d).sql
```

### Мониторинг

```bash
# Установка мониторинга
sudo apt install htop iotop nethogs

# Мониторинг процессов
htop
sudo iotop
sudo nethogs

# Мониторинг логов
sudo tail -f /var/log/rp_server.log | grep ERROR
```

---

## 🛠️ Устранение неполадок

### Частые проблемы

1. **Сервер не запускается**
   ```bash
   # Проверяем логи
   sudo supervisorctl status rp_server
   sudo tail -f /var/log/rp_server.log
   ```

2. **Проблемы с базой данных**
   ```bash
   # Проверяем подключение
   sudo -u postgres psql rp_server_prod
   # Проверяем настройки в .env
   ```

3. **Nginx ошибки**
   ```bash
   # Проверяем конфигурацию
   sudo nginx -t
   sudo systemctl status nginx
   ```

### Полезные ссылки

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [Gunicorn Documentation](https://docs.gunicorn.org/)

---

**Готово! Теперь у вас есть полное руководство по развертыванию РП сервера в любой среде.** 🚀