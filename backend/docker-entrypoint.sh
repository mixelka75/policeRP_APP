#!/bin/bash
set -e

echo "🚀 Starting RP Server Backend with Discord Auth..."
echo "🔧 Environment: ${ENVIRONMENT:-development}"
echo "🗄️  Database: ${DATABASE_URL}"
echo "🎮 Discord Client ID: ${DISCORD_CLIENT_ID:0:8}..."
echo "🌐 SP-Worlds Map ID: ${SPWORLDS_MAP_ID}"

# Функция для проверки переменных окружения
check_environment() {
    echo "🔍 Checking environment variables..."

    # Обязательные переменные для Discord
    if [ -z "$DISCORD_CLIENT_ID" ]; then
        echo "❌ DISCORD_CLIENT_ID is required"
        exit 1
    fi

    if [ -z "$DISCORD_CLIENT_SECRET" ]; then
        echo "❌ DISCORD_CLIENT_SECRET is required"
        exit 1
    fi

    if [ -z "$DISCORD_GUILD_ID" ]; then
        echo "❌ DISCORD_GUILD_ID is required"
        exit 1
    fi

    # Обязательные переменные для SP-Worlds
    if [ -z "$SPWORLDS_MAP_ID" ]; then
        echo "⚠️  SPWORLDS_MAP_ID is not set, SP-Worlds integration will be disabled"
    fi

    if [ -z "$SPWORLDS_MAP_TOKEN" ]; then
        echo "⚠️  SPWORLDS_MAP_TOKEN is not set, SP-Worlds integration will be disabled"
    fi

    echo "✅ Environment check completed"
}

# Функция для ожидания базы данных
wait_for_db() {
    echo "⏳ Waiting for database connection..."

    # Простое ожидание базы данных
    for i in {1..60}; do
        if python -c "
import psycopg2
import os
import sys
try:
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.close()
    sys.exit(0)
except Exception as e:
    print(f'Database not ready: {e}')
    sys.exit(1)
" > /dev/null 2>&1; then
            echo "✅ Database is ready!"
            return 0
        fi
        echo "Database is not ready yet. Retrying in 2 seconds... ($i/60)"
        sleep 2
    done

    echo "❌ Database connection failed after 120 seconds"
    exit 1
}

# Функция для создания enum типов в базе данных
create_enums() {
    echo "🔧 Creating enum types if they don't exist..."
    python -c "
import psycopg2
import os

try:
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    # Проверяем и создаем enum типы
    cur.execute(\"SELECT 1 FROM pg_type WHERE typname = 'userrole'\")
    if not cur.fetchone():
        cur.execute(\"CREATE TYPE userrole AS ENUM ('admin', 'police')\")
        print('✅ Created userrole enum')
    else:
        print('✅ userrole enum already exists')

    cur.execute(\"SELECT 1 FROM pg_type WHERE typname = 'gender'\")
    if not cur.fetchone():
        cur.execute(\"CREATE TYPE gender AS ENUM ('male', 'female')\")
        print('✅ Created gender enum')
    else:
        print('✅ gender enum already exists')

    conn.commit()
    cur.close()
    conn.close()
    print('✅ Enum types ready')
except Exception as e:
    print(f'❌ Error creating enums: {e}')
    # Не завершаем выполнение, миграции могут создать типы
" || echo "⚠️ Could not create enums manually, will try via migrations"
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
    migration_count=$(find alembic/versions -name "*.py" -not -name "__init__.py" | wc -l)

    if [ "$migration_count" -eq 0 ]; then
        echo "🆕 No migrations found, creating initial migration..."

        # Создаем enum типы перед созданием миграции
        create_enums

        # Создаем миграцию
        python -m alembic revision --autogenerate -m "Initial Discord auth migration"
    else
        echo "📋 Found $migration_count existing migrations:"
        ls -la alembic/versions/ | grep "\.py$" | grep -v "__init__"
    fi

    # Выполняем миграции
    echo "⬆️  Applying migrations..."
    python -m alembic upgrade head

    echo "✅ Migrations completed successfully!"
}

# Функция для проверки внешних сервисов
check_external_services() {
    echo "🌐 Checking external services..."

    # Проверяем SP-Worlds API
    if [ -n "$SPWORLDS_MAP_ID" ] && [ -n "$SPWORLDS_MAP_TOKEN" ]; then
        python -c "
import asyncio
import sys
sys.path.append('/app')
from app.clients.spworlds import spworlds_client

async def check_spworlds():
    try:
        result = await spworlds_client.ping()
        if result:
            print('✅ SP-Worlds API: connected')
        else:
            print('⚠️  SP-Worlds API: not responding')
    except Exception as e:
        print(f'❌ SP-Worlds API error: {e}')
    finally:
        await spworlds_client.close()

asyncio.run(check_spworlds())
" || echo "⚠️ Could not check SP-Worlds API"
    else
        echo "⚠️ SP-Worlds API: not configured"
    fi

    # Проверяем Discord API (базовая проверка)
    echo "🔍 Discord integration configured for Guild ID: ${DISCORD_GUILD_ID}"
    echo "🔍 Discord roles: Police='${DISCORD_POLICE_ROLE_NAME}', Admin='${DISCORD_ADMIN_ROLE_NAME}'"
}

# Функция для настройки логирования
setup_logging() {
    echo "📝 Setting up logging..."

    # Создаем директорию для логов
    mkdir -p logs

    # Устанавливаем права доступа
    chmod 755 logs

    echo "✅ Logging configured"
}

# Функция для отображения информации о конфигурации
show_config_info() {
    echo ""
    echo "🔧 Configuration Summary:"
    echo "================================"
    echo "🎮 Discord OAuth2: Enabled"
    echo "   - Client ID: ${DISCORD_CLIENT_ID:0:8}..."
    echo "   - Guild ID: ${DISCORD_GUILD_ID}"
    echo "   - Redirect URI: ${DISCORD_REDIRECT_URI}"
    echo "   - Police Role: ${DISCORD_POLICE_ROLE_NAME}"
    echo "   - Admin Role: ${DISCORD_ADMIN_ROLE_NAME}"
    echo ""
    echo "🌐 SP-Worlds Integration: $([ -n "$SPWORLDS_MAP_ID" ] && echo "Enabled" || echo "Disabled")"
    if [ -n "$SPWORLDS_MAP_ID" ]; then
        echo "   - Map ID: ${SPWORLDS_MAP_ID}"
        echo "   - API URL: ${SPWORLDS_API_URL}"
    fi
    echo ""
    echo "⚙️  Role Checking: $([ "$ROLE_CHECK_INTERVAL" -gt 0 ] 2>/dev/null && echo "Enabled (${ROLE_CHECK_INTERVAL} min)" || echo "Disabled")"
    echo "🔗 Frontend URL: ${FRONTEND_URL}"
    echo "🛡️  Environment: ${ENVIRONMENT:-development}"
    echo "================================"
    echo ""
}

# Основная логика
if [ "$1" = "python" ] || [ "$1" = "uvicorn" ] || [[ "$1" == *"uvicorn"* ]]; then
    # Проверяем переменные окружения
    check_environment

    # Настраиваем логирование
    setup_logging

    # Ждем базу данных
    wait_for_db

    # Выполняем миграции
    run_migrations

    # Проверяем внешние сервисы
    check_external_services

    # Показываем информацию о конфигурации
    show_config_info

    echo "🎉 Backend initialization completed!"
    echo "🌐 Starting web server..."
    echo "📚 API Documentation: $([ "$DEBUG" = "true" ] && echo "http://localhost:8000/docs" || echo "Disabled in production")"
    echo "🔐 Discord Auth URL: http://localhost:8000/api/v1/auth/discord/login"
    echo ""
fi

# Выполняем переданную команду
exec "$@"