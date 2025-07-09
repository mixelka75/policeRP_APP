#!/bin/bash

# Скрипт для запуска приложения

set -e

echo "🚀 Запуск RP Server Backend"

# Проверяем, есть ли Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Установите Docker и повторите попытку."
    exit 1
fi

# Проверяем, поддерживает ли Docker команду compose
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose не поддерживается. Обновите Docker или установите docker-compose отдельно."
    exit 1
fi

# Режим запуска
MODE=${1:-prod}

case $MODE in
    "dev" | "development")
        echo "🔧 Запуск в режиме разработки..."
        docker compose -f docker-compose.dev.yml up -d
        echo "✅ Приложение запущено в режиме разработки"
        echo "📖 Документация: http://localhost:8000/docs"
        echo "🔍 Логи: docker compose -f docker-compose.dev.yml logs -f"
        ;;
    "prod" | "production")
        echo "🚀 Запуск в режиме продакшена..."
        docker compose up -d
        echo "✅ Приложение запущено в режиме продакшена"
        echo "💚 Статус: http://localhost:8000/health"
        echo "🔍 Логи: docker compose logs -f"
        ;;
    "build")
        echo "🔨 Пересборка контейнеров..."
        docker compose build --no-cache
        echo "✅ Контейнеры пересобраны"
        ;;
    "stop")
        echo "⏹️ Остановка приложения..."
        docker compose down
        docker compose -f docker-compose.dev.yml down
        echo "✅ Приложение остановлено"
        ;;
    "clean")
        echo "🧹 Очистка Docker..."
        docker compose down -v --remove-orphans
        docker system prune -f
        echo "✅ Очистка завершена"
        ;;
    "logs")
        echo "📋 Показать логи..."
        docker compose logs -f
        ;;
    "status")
        echo "📊 Статус контейнеров:"
        docker compose ps
        ;;
    *)
        echo "Использование: $0 {dev|prod|build|stop|clean|logs|status}"
        echo "  dev    - запуск в режиме разработки"
        echo "  prod   - запуск в режиме продакшена"
        echo "  build  - пересборка контейнеров"
        echo "  stop   - остановка приложения"
        echo "  clean  - очистка Docker"
        echo "  logs   - показать логи"
        echo "  status - статус контейнеров"
        exit 1
        ;;
esac