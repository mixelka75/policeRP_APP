# Makefile для RP Server

.PHONY: help build up down logs restart clean status shell-backend shell-frontend shell-db backup restore

# Показать помощь
help:
	@echo "🚀 RP Server - Команды управления"
	@echo ""
	@echo "📦 Основные команды:"
	@echo "  make up          - Запустить все сервисы"
	@echo "  make down        - Остановить все сервисы"
	@echo "  make build       - Собрать и запустить сервисы"
	@echo "  make restart     - Перезапустить все сервисы"
	@echo "  make logs        - Показать логи всех сервисов"
	@echo ""
	@echo "🔍 Мониторинг:"
	@echo "  make status      - Показать статус сервисов"
	@echo "  make logs-backend    - Логи бэкенда"
	@echo "  make logs-frontend   - Логи фронтенда"
	@echo "  make logs-db         - Логи базы данных"
	@echo ""
	@echo "🛠️  Разработка:"
	@echo "  make shell-backend   - Подключиться к контейнеру бэкенда"
	@echo "  make shell-frontend  - Подключиться к контейнеру фронтенда"
	@echo "  make shell-db        - Подключиться к базе данных"
	@echo ""
	@echo "💾 Данные:"
	@echo "  make backup      - Создать резервную копию БД"
	@echo "  make restore     - Восстановить БД из копии"
	@echo "  make clean       - Удалить все данные и контейнеры"
	@echo ""
	@echo "🌐 Доступ:"
	@echo "  Frontend:  http://localhost:3000"
	@echo "  Backend:   http://localhost:8000"
	@echo "  API Docs:  http://localhost:8000/docs"
	@echo "  Admin:     admin / admin123"

# Запуск всех сервисов
up:
	@echo "🚀 Запуск RP Server..."
	docker-compose up -d
	@echo "✅ Сервисы запущены!"
	@echo "🌐 Frontend: http://localhost:3000"
	@echo "🔧 Backend: http://localhost:8000"
	@echo "📚 API Docs: http://localhost:8000/docs"

# Остановка всех сервисов
down:
	@echo "🛑 Остановка сервисов..."
	docker-compose down
	@echo "✅ Все сервисы остановлены"

# Сборка и запуск
build:
	@echo "🔨 Сборка и запуск сервисов..."
	docker-compose up --build -d
	@echo "✅ Сборка завершена и сервисы запущены!"

# Перезапуск
restart:
	@echo "🔄 Перезапуск сервисов..."
	docker-compose restart
	@echo "✅ Сервисы перезапущены!"

# Просмотр логов
logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-db:
	docker-compose logs -f database

# Статус сервисов
status:
	@echo "📊 Статус сервисов:"
	docker-compose ps
	@echo ""
	@echo "🔍 Использование ресурсов:"
	docker stats --no-stream

# Подключение к контейнерам
shell-backend:
	docker-compose exec backend bash

shell-frontend:
	docker-compose exec frontend sh

shell-db:
	docker-compose exec database psql -U rp_user -d rp_server_db

# Резервное копирование
backup:
	@echo "💾 Создание резервной копии..."
	mkdir -p backups
	docker-compose exec database pg_dump -U rp_user rp_server_db > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ Резервная копия создана в папке backups/"

# Восстановление (использование: make restore FILE=backup_file.sql)
restore:
	@if [ -z "$(FILE)" ]; then \
		echo "❌ Укажите файл: make restore FILE=backup_file.sql"; \
		exit 1; \
	fi
	@echo "📥 Восстановление из файла $(FILE)..."
	docker-compose exec -T database psql -U rp_user -d rp_server_db < $(FILE)
	@echo "✅ База данных восстановлена!"

# Полная очистка
clean:
	@echo "🧹 Удаление всех данных и контейнеров..."
	@read -p "Вы уверены? Все данные будут удалены! (y/N): " confirm && [ "$$confirm" = "y" ]
	docker-compose down -v --remove-orphans
	docker system prune -f
	docker volume prune -f
	@echo "✅ Очистка завершена!"

# Быстрые команды
start: up
stop: down
rebuild: down build