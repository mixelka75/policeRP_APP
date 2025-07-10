#!/bin/bash
set -e

echo "🚀 Starting RP Server Backend..."
echo "🔧 Environment: ${ENVIRONMENT:-development}"
echo "🗄️  Database: ${DATABASE_URL}"

# Функция для ожидания базы данных
wait_for_db() {
    echo "⏳ Waiting for database connection..."

    # Простое ожидание базы данных
    for i in {1..30}; do
        if python -c "
import psycopg2
import os
import sys
try:
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.close()
    sys.exit(0)
except:
    sys.exit(1)
" > /dev/null 2>&1; then
            echo "✅ Database is ready!"
            return 0
        fi
        echo "Database is not ready yet. Retrying in 2 seconds... ($i/30)"
        sleep 2
    done

    echo "❌ Database connection failed after 60 seconds"
    exit 1
}

# Функция для выполнения миграций
run_migrations() {
    echo "🔄 Running database migrations..."

    # Проверяем существует ли папка alembic/versions
    if [ ! -d "alembic/versions" ]; then
        echo "📁 Creating alembic versions directory..."
        mkdir -p alembic/versions
    fi

    # Проверяем есть ли файлы миграций
    if [ -z "$(ls -A alembic/versions 2>/dev/null)" ]; then
        echo "🆕 No migrations found, creating initial migration..."
        python -m alembic revision --autogenerate -m "Initial migration"
    else
        echo "📋 Found existing migrations:"
        ls -la alembic/versions/
    fi

    # Выполняем миграции
    echo "⬆️  Applying migrations..."
    python -m alembic upgrade head

    echo "✅ Migrations completed successfully!"
}

# Функция для создания администратора
create_admin() {
    echo "👤 Checking admin user..."
    python -c "
import sys
sys.path.append('/app')
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from app.core.config import settings
from app.crud.user import user_crud
from app.schemas.user import UserCreate
from app.models.user import UserRole

try:
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    admin_user = user_crud.get_by_username(db, username=settings.ADMIN_USERNAME)
    if not admin_user:
        admin_create = UserCreate(
            username=settings.ADMIN_USERNAME,
            password=settings.ADMIN_PASSWORD,
            role=UserRole.ADMIN,
            is_active=True
        )
        admin_user = user_crud.create(db, obj_in=admin_create)
        print(f'✅ Admin user created: {admin_user.username}')
    else:
        print(f'✅ Admin user already exists: {admin_user.username}')

    db.close()
except Exception as e:
    print(f'❌ Error creating admin user: {e}')
    sys.exit(1)
"
}

# Основная логика
if [ "$1" = "python" ] || [ "$1" = "uvicorn" ] || [[ "$1" == *"uvicorn"* ]]; then
    # Ждем базу данных
    wait_for_db

    # Выполняем миграции
    run_migrations

    # Создаем администратора
    create_admin

    echo "🎉 Backend initialization completed!"
    echo "🌐 Starting web server..."
fi

# Выполняем переданную команду
exec "$@"