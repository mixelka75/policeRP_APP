# Команды для удобного управления Docker

.PHONY: build up down logs dev-up dev-down prod-up prod-down

# Разработка
dev-build:
	docker-compose -f docker-compose.dev.yml build

dev-up:
	docker-compose -f docker-compose.dev.yml up -d

dev-down:
	docker-compose -f docker-compose.dev.yml down

dev-logs:
	docker-compose -f docker-compose.dev.yml logs -f

dev-restart:
	docker-compose -f docker-compose.dev.yml restart backend

# Продакшен
prod-build:
	docker-compose build

prod-up:
	docker-compose up -d

prod-down:
	docker-compose down

prod-logs:
	docker-compose logs -f

prod-restart:
	docker-compose restart backend

# Утилиты
clean:
	docker-compose down -v --remove-orphans
	docker system prune -f

rebuild:
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d

# Бэкап базы данных
backup:
	docker exec -t $$(docker-compose ps -q db) pg_dump -U rp_user rp_server_db > backup_$$(date +%Y%m%d_%H%M%S).sql

# Восстановление базы данных
restore:
	@echo "Использование: make restore FILE=backup_file.sql"
	docker exec -i $$(docker-compose ps -q db) psql -U rp_user -d rp_server_db < $(FILE)