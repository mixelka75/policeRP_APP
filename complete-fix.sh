#!/bin/bash
# complete-fix.sh - Полное исправление проблем с enum типами

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Полное исправление проблем с enum типами${NC}"
echo "================================================="

# 1. Остановка всех сервисов
echo -e "${YELLOW}🛑 Остановка всех сервисов...${NC}"
docker compose down

# 2. Удаление volume с данными базы данных
echo -e "${YELLOW}🗑️  Удаление данных базы данных...${NC}"
docker volume rm rp_server_backend_postgres_data 2>/dev/null || true

# 3. Удаление старых миграций
echo -e "${YELLOW}🗑️  Очистка старых миграций...${NC}"
find alembic/versions -name "*.py" -not -name "__init__.py" -delete 2>/dev/null || true

# 4. Показать что нужно заменить
echo -e "${YELLOW}📝 Файлы для замены:${NC}"
echo "1. app/main.py - убрать Base.metadata.create_all()"
echo "2. app/models/user.py - исправить enum"
echo "3. app/models/passport.py - исправить enum"
echo "4. alembic/versions/001_initial_migration.py - правильная миграция"

echo ""
echo -e "${YELLOW}⚠️  ВНИМАНИЕ! Замените файлы на исправленные версии перед продолжением!${NC}"
echo ""
read -p "Нажмите Enter после замены файлов для продолжения..."

# 5. Пересборка и запуск
echo -e "${YELLOW}🔨 Пересборка образов...${NC}"
docker compose build --no-cache

echo -e "${YELLOW}🚀 Запуск базы данных...${NC}"
docker compose up database -d

# Ждем запуска базы данных
echo -e "${YELLOW}⏳ Ожидание запуска базы данных...${NC}"
sleep 15

# 6. Запуск backend
echo -e "${YELLOW}🚀 Запуск backend...${NC}"
docker compose up backend -d

# Ждем запуска backend
echo -e "${YELLOW}⏳ Ожидание запуска backend...${NC}"
sleep 20

# 7. Создание новой миграции (если нужно)
echo -e "${YELLOW}📋 Создание миграции...${NC}"
docker compose exec backend python -m alembic revision --autogenerate -m "Initial migration with enums" || echo "Миграция уже существует"

# 8. Применение миграций
echo -e "${YELLOW}⬆️  Применение миграций...${NC}"
docker compose exec backend python -m alembic upgrade head

# 9. Запуск всех сервисов
echo -e "${YELLOW}🚀 Запуск всех сервисов...${NC}"
docker compose up -d

# 10. Проверка состояния
echo -e "${YELLOW}📊 Проверка состояния сервисов...${NC}"
sleep 10
docker compose ps

# 11. Проверка API
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

# 12. Тест создания паспорта
echo -e "${YELLOW}🧪 Тестирование создания паспорта...${NC}"

# Получаем токен
TOKEN=$(curl -s -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✅ Получен токен авторизации${NC}"
    
    # Тестируем создание паспорта
    RESPONSE=$(curl -s -X POST "http://localhost:8000/api/v1/passports/" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "first_name": "Тест",
        "last_name": "Тестов",
        "nickname": "test_user",
        "age": 25,
        "gender": "male"
      }')
    
    if echo "$RESPONSE" | grep -q '"id"'; then
        echo -e "${GREEN}✅ Паспорт создан успешно!${NC}"
        echo -e "${GREEN}✅ Проблема с enum типами решена!${NC}"
    else
        echo -e "${RED}❌ Ошибка создания паспорта:${NC}"
        echo "$RESPONSE"
    fi
else
    echo -e "${RED}❌ Не удалось получить токен авторизации${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Исправление завершено!${NC}"
echo "================================================="
echo ""
echo -e "${BLUE}📱 Доступные сервисы:${NC}"
echo -e "  🌐 Frontend:    ${GREEN}http://localhost:3000${NC}"
echo -e "  🔧 Backend:     ${GREEN}http://localhost:8000${NC}"
echo -e "  📚 API Docs:    ${GREEN}http://localhost:8000/docs${NC}"
echo ""
echo -e "${BLUE}👤 Учетные данные:${NC}"
echo -e "  Логин:    ${YELLOW}admin${NC}"
echo -e "  Пароль:   ${YELLOW}admin123${NC}"
echo ""
echo -e "${GREEN}Попробуйте создать паспорт через интерфейс!${NC}"
