#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 RP Server - Быстрый запуск${NC}"
echo "========================================"

# Проверка Docker
echo -e "${YELLOW}📦 Проверка Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker не установлен!${NC}"
    echo "Установите Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose не установлен!${NC}"
    echo "Установите Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✅ Docker найден: $(docker --version)${NC}"
echo -e "${GREEN}✅ Docker Compose найден: $(docker compose --version)${NC}"

# Проверка что docker запущен
echo -e "${YELLOW}🔍 Проверка состояния Docker...${NC}"
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker не запущен!${NC}"
    echo "Запустите Docker Desktop или сервис Docker"
    exit 1
fi

echo -e "${GREEN}✅ Docker работает${NC}"

# Создание необходимых директорий
echo -e "${YELLOW}📁 Создание директорий...${NC}"
mkdir -p logs
mkdir -p backups

# Остановка существующих контейнеров (если есть)
echo -e "${YELLOW}🛑 Остановка существующих контейнеров...${NC}"
docker compose down --remove-orphans

# Сборка и запуск
echo -e "${YELLOW}🔨 Сборка и запуск сервисов...${NC}"
docker compose up --build -d

# Ожидание запуска сервисов
echo -e "${YELLOW}⏳ Ожидание запуска сервисов...${NC}"
sleep 10

# Проверка состояния сервисов
echo -e "${YELLOW}📊 Проверка состояния сервисов...${NC}"
docker compose ps

# Проверка здоровья API
echo -e "${YELLOW}🔍 Проверка API...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:8000/health &> /dev/null; then
        echo -e "${GREEN}✅ Backend API запущен!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Backend API не отвечает${NC}"
        echo "Проверьте логи: docker compose logs backend"
        exit 1
    fi
    sleep 2
done

# Проверка фронтенда
echo -e "${YELLOW}🔍 Проверка Frontend...${NC}"
for i in {1..15}; do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|404"; then
        echo -e "${GREEN}✅ Frontend запущен!${NC}"
        break
    fi
    if [ $i -eq 15 ]; then
        echo -e "${YELLOW}⚠️  Frontend может быть еще не готов${NC}"
        break
    fi
    sleep 2
done

echo ""
echo -e "${GREEN}🎉 RP Server успешно запущен!${NC}"
echo "========================================"
echo ""
echo -e "${BLUE}📱 Доступные сервисы:${NC}"
echo -e "  🌐 Frontend:    ${GREEN}http://localhost:3000${NC}"
echo -e "  🔧 Backend:     ${GREEN}http://localhost:8000${NC}"
echo -e "  📚 API Docs:    ${GREEN}http://localhost:8000/docs${NC}"
echo -e "  🗄️  Database:    ${GREEN}localhost:5432${NC}"
echo ""
echo -e "${BLUE}👤 Учетные данные:${NC}"
echo -e "  Логин:    ${YELLOW}admin${NC}"
echo -e "  Пароль:   ${YELLOW}admin123${NC}"
echo ""
echo -e "${BLUE}🛠️  Полезные команды:${NC}"
echo "  make logs          - Просмотр логов"
echo "  make status        - Статус сервисов"
echo "  make down          - Остановка сервисов"
echo "  make backup        - Резервная копия БД"
echo ""
echo -e "${GREEN}Откройте http://localhost:3000 чтобы начать!${NC}"

# Автоматически открыть браузер (опционально)
if command -v xdg-open &> /dev/null; then
    echo -e "${YELLOW}🌐 Открываем браузер...${NC}"
    xdg-open http://localhost:3000 &
elif command -v open &> /dev/null; then
    echo -e "${YELLOW}🌐 Открываем браузер...${NC}"
    open http://localhost:3000 &
fi