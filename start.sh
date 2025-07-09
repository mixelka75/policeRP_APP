#!/bin/bash
# start.sh - Главный скрипт запуска РП Сервер

set -e

echo "🚀 Запуск РП Сервер - Система управления"
echo "========================================"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для цветного вывода
print_color() {
    printf "${2}${1}${NC}\n"
}

# Проверка Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_color "❌ Docker не установлен. Установите Docker и повторите попытку." $RED
        exit 1
    fi
    
    if ! docker compose version &> /dev/null; then
        print_color "❌ Docker Compose не установлен. Установите Docker Compose и повторите попытку." $RED
        exit 1
    fi

    if ! docker info &> /dev/null; then
        print_color "❌ Docker не запущен. Запустите Docker и повторите попытку." $RED
        exit 1
    fi
}

# Проверка портов
check_ports() {
    local ports=("3000" "8000" "5432")
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; then
            print_color "⚠️  Порт $port уже используется" $YELLOW
            read -p "Хотите остановить процесс на порту $port? (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                local pid=$(lsof -Pi :$port -sTCP:LISTEN -t)
                kill -9 $pid 2>/dev/null || true
                print_color "✅ Процесс на порту $port остановлен" $GREEN
            fi
        fi
    done
}

# Создание .env файлов если их нет
create_env_files() {
    if [ ! -f backend/.env ]; then
        print_color "📄 Создание backend/.env из примера..." $BLUE
        cp backend/.env.example backend/.env
    fi

    if [ ! -f frontend/.env ]; then
        print_color "📄 Создание frontend/.env из примера..." $BLUE
        cp frontend/.env.example frontend/.env
    fi
}

# Переменная для хранения текущего режима
CURRENT_MODE=""

# Основная функция запуска
start_services() {
    local mode=${1:-production}
    CURRENT_MODE=$mode

    print_color "🔄 Запуск в режиме: $mode" $BLUE

    case $mode in
        "dev" | "development")
            print_color "🔧 Запуск в режиме разработки..." $YELLOW
            docker compose -f docker-compose.dev.yml up -d
            ;;
        "prod" | "production")
            print_color "🏭 Запуск в продакшн режиме..." $GREEN
            docker compose up -d
            ;;
        "build")
            print_color "🔨 Сборка и запуск..." $BLUE
            docker compose build --no-cache
            docker compose up -d
            ;;
        *)
            print_color "❌ Неизвестный режим: $mode" $RED
            echo "Доступные режимы: dev, prod, build"
            exit 1
            ;;
    esac
}

# Проверка статуса сервисов
check_services() {
    print_color "🔍 Проверка статуса сервисов..." $BLUE

    local max_attempts=30
    local attempt=1
    local compose_file_arg=""

    # Определяем compose файл в зависимости от режима
    if [[ "$CURRENT_MODE" == "dev" || "$CURRENT_MODE" == "development" ]]; then
        compose_file_arg="-f docker-compose.dev.yml"
    fi

    # Проверка backend
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s http://localhost:8000/health > /dev/null 2>&1; then
            print_color "✅ Backend готов" $GREEN
            break
        else
            print_color "⏳ Ожидание backend... ($attempt/$max_attempts)" $YELLOW
            sleep 2
            ((attempt++))
        fi
    done

    if [ $attempt -gt $max_attempts ]; then
        print_color "❌ Backend не запустился в течение времени ожидания" $RED
        print_color "📋 Логи backend:" $BLUE
        docker compose $compose_file_arg logs backend | tail -20
        exit 1
    fi

    # Проверка frontend (только если сервис существует в compose файле)
    if docker compose $compose_file_arg ps --services | grep -q "^frontend$"; then
        attempt=1
        while [ $attempt -le $max_attempts ]; do
            if curl -f -s http://localhost:3000 > /dev/null 2>&1; then
                print_color "✅ Frontend готов" $GREEN
                break
            else
                print_color "⏳ Ожидание frontend... ($attempt/$max_attempts)" $YELLOW
                sleep 2
                ((attempt++))
            fi
        done

        if [ $attempt -gt $max_attempts ]; then
            print_color "❌ Frontend не запустился в течение времени ожидания" $RED
            print_color "📋 Логи frontend:" $BLUE
            docker compose $compose_file_arg logs frontend | tail -20
            exit 1
        fi
    else
        print_color "ℹ️  Frontend сервис не определен в compose файле, пропускаем проверку" $YELLOW
    fi
}

# Остановка сервисов
stop_services() {
    print_color "⏹️  Остановка сервисов..." $YELLOW
    docker compose down
    docker compose -f docker-compose.dev.yml down
    print_color "✅ Сервисы остановлены" $GREEN
}

# Показ логов
show_logs() {
    local service=${1:-""}
    if [ -z "$service" ]; then
        docker compose logs -f
    else
        docker compose logs -f $service
    fi
}

# Показ статуса
show_status() {
    print_color "📊 Статус контейнеров:" $BLUE
    docker compose ps

    print_color "\n🌐 Доступные URL:" $BLUE
    print_color "Frontend: http://localhost:3000" $GREEN
    print_color "Backend:  http://localhost:8000" $GREEN
    print_color "API Docs: http://localhost:8000/docs" $GREEN
    print_color "Health:   http://localhost:8000/health" $GREEN

    print_color "\n👤 Пользователь по умолчанию:" $BLUE
    print_color "Логин:    admin" $GREEN
    print_color "Пароль:   admin123" $GREEN
}

# Очистка данных
clean_data() {
    print_color "🧹 Очистка данных..." $YELLOW
    read -p "Вы уверены, что хотите удалить ВСЕ данные? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker compose down -v
        docker volume prune -f
        print_color "✅ Данные очищены" $GREEN
    else
        print_color "❌ Операция отменена" $RED
    fi
}

# Обновление системы
update_system() {
    print_color "🔄 Обновление системы..." $BLUE
    docker compose down
    docker compose pull
    docker compose build --no-cache
    docker-compose up -d
    print_color "✅ Система обновлена" $GREEN
}

# Backup базы данных
backup_database() {
    local backup_name="backup_$(date +%Y%m%d_%H%M%S).sql"
    print_color "💾 Создание резервной копии: $backup_name" $BLUE

    docker compose exec -T database pg_dump -U rp_user rp_server_db > "backups/$backup_name"
    print_color "✅ Резервная копия создана: backups/$backup_name" $GREEN
}

# Восстановление базы данных
restore_database() {
    local backup_file=$1
    if [ -z "$backup_file" ]; then
        print_color "❌ Укажите файл резервной копии" $RED
        echo "Использование: $0 restore <backup_file>"
        exit 1
    fi

    if [ ! -f "$backup_file" ]; then
        print_color "❌ Файл резервной копии не найден: $backup_file" $RED
        exit 1
    fi

    print_color "🔄 Восстановление базы данных из: $backup_file" $BLUE
    docker compose exec -T database psql -U rp_user -d rp_server_db < "$backup_file"
    print_color "✅ База данных восстановлена" $GREEN
}

# Главная функция
main() {
    local command=${1:-"start"}
    
    case $command in
        "start")
            create_env_files
            check_docker
            check_ports
            start_services ${2:-"production"}
            check_services
            show_status
            ;;
        "dev")
            create_env_files
            check_docker
            check_ports
            start_services "development"
            check_services
            show_status
            ;;
        "build")
            create_env_files
            check_docker
            start_services "build"
            check_services
            show_status
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            stop_services
            sleep 2
            start_services ${2:-"production"}
            check_services
            show_status
            ;;
        "logs")
            show_logs $2
            ;;
        "status")
            show_status
            ;;
        "clean")
            clean_data
            ;;
        "update")
            update_system
            ;;
        "backup")
            mkdir -p backups
            backup_database
            ;;
        "restore")
            restore_database $2
            ;;
        "help" | "-h" | "--help")
            echo "Использование: $0 <command> [options]"
            echo ""
            echo "Команды:"
            echo "  start [mode]    - Запуск системы (production|development)"
            echo "  dev             - Запуск в режиме разработки"
            echo "  build           - Сборка и запуск"
            echo "  stop            - Остановка всех сервисов"
            echo "  restart [mode]  - Перезапуск системы"
            echo "  logs [service]  - Просмотр логов"
            echo "  status          - Показать статус"
            echo "  clean           - Очистить все данные"
            echo "  update          - Обновить систему"
            echo "  backup          - Создать резервную копию БД"
            echo "  restore <file>  - Восстановить БД из резервной копии"
            echo "  help            - Показать эту справку"
            echo ""
            echo "Примеры:"
            echo "  $0 start        # Запуск в продакшн режиме"
            echo "  $0 dev          # Запуск в режиме разработки"
            echo "  $0 logs backend # Просмотр логов backend"
            echo "  $0 clean        # Очистка всех данных"
            ;;
        *)
            print_color "❌ Неизвестная команда: $command" $RED
            echo "Используйте '$0 help' для получения справки"
            exit 1
            ;;
    esac
}

# Запуск главной функции
main "$@"