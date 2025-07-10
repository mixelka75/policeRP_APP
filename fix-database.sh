#!/bin/bash
# fix-database.sh - Скрипт для исправления проблем с базой данных

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Исправление проблем с базой данных${NC}"
echo "========================================"

# Остановка сервисов
echo -e "${YELLOW}🛑 Остановка сервисов...${NC}"
docker compose down

# Удаление старых volumes с данными
echo -e "${YELLOW}🗑️  Удаление старых данных...${NC}"
docker volume rm rp_server_backend_postgres_data 2>/dev/null || true

# Создание резервной копии (если нужно)
if [ "$1" = "--backup" ]; then
    echo -e "${YELLOW}💾 Создание резервной копии...${NC}"
    mkdir -p backups
    docker compose up database -d
    sleep 10
    docker compose exec database pg_dump -U rp_user rp_server_db > backups/backup_before_fix_$(date +%Y%m%d_%H%M%S).sql
    docker compose down
fi

# Удаление старых миграций (кроме __init__.py)
echo -e "${YELLOW}🗑️  Очистка старых миграций...${NC}"
find alembic/versions -name "*.py" -not -name "__init__.py" -delete 2>/dev/null || true

# Создание новой миграции
echo -e "${YELLOW}📝 Создание новой миграции...${NC}"

# Запуск только базы данных
echo -e "${YELLOW}🚀 Запуск базы данных...${NC}"
docker compose up database -d
sleep 15

# Создание миграции
echo -e "${YELLOW}📋 Создание миграции...${NC}"
docker compose exec backend python -m alembic revision --autogenerate -m "Initial migration with proper enums" || echo "Backend not ready yet, continuing..."

# Запуск backend для применения миграций
echo -e "${YELLOW}🚀 Запуск backend...${NC}"
docker compose up backend -d
sleep 20

# Применение миграций
echo -e "${YELLOW}⬆️  Применение миграций...${NC}"
docker compose exec backend python -m alembic upgrade head

# Запуск всех сервисов
echo -e "${YELLOW}🚀 Запуск всех сервисов...${NC}"
docker compose up -d

# Проверка состояния
echo -e "${YELLOW}📊 Проверка состояния...${NC}"
sleep 10
docker compose ps

# Проверка API
echo -e "${YELLOW}🔍 Проверка API...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:8000/health &> /dev/null; then
        echo -e "${GREEN}✅ API работает!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ API не отвечает${NC}"
        echo "Проверьте логи: docker compose logs backend"
        exit 1
    fi
    sleep 2
done

echo ""
echo -e "${GREEN}🎉 База данных исправлена!${NC}"
echo "========================================"
echo ""
echo -e "${BLUE}📱 Доступные сервисы:${NC}"
echo -e "  🌐 Frontend:    ${GREEN}http://localhost:3000${NC}"
echo -e "  🔧 Backend:     ${GREEN}http://localhost:8000${NC}"
echo -e "  📚 API Docs:    ${GREEN}http://localhost:8000/docs${NC}"
echo ""
echo -e "${BLUE}👤 Учетные данные:${NC}"
echo -e "  Логин:    ${YELLOW}admin${NC}"
echo -e "  Пароль:   ${YELLOW}admin123${NC}"