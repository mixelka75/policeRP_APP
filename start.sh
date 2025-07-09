#!/bin/bash
# start.sh - Скрипт для запуска РП Сервер Frontend

set -e

echo "🚀 Запуск РП Сервер Frontend"

# Проверяем, есть ли Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Установите Node.js 18+ и повторите попытку."
    exit 1
fi

# Проверяем версию Node.js
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Требуется Node.js 18+. Текущая версия: $(node --version)"
    exit 1
fi

# Проверяем, есть ли npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm не установлен. Установите npm и повторите попытку."
    exit 1
fi

# Режим запуска
MODE=${1:-dev}

case $MODE in
    "dev" | "development")
        echo "🔧 Запуск в режиме разработки..."

        # Проверяем, есть ли node_modules
        if [ ! -d "node_modules" ]; then
            echo "📦 Установка зависимостей..."
            npm install
        fi

        # Проверяем, есть ли .env файл
        if [ ! -f ".env" ]; then
            echo "📄 Создание .env файла..."
            cp .env.example .env
            echo "✅ .env файл создан. Настройте переменные окружения при необходимости."
        fi

        echo "🌐 Запуск dev сервера..."
        npm run dev
        ;;

    "build")
        echo "🔨 Сборка для продакшена..."

        # Проверяем зависимости
        if [ ! -d "node_modules" ]; then
            echo "📦 Установка зависимостей..."
            npm ci
        fi

        echo "🏗️ Сборка приложения..."
        npm run build

        echo "✅ Сборка завершена. Файлы находятся в папке dist/"
        ;;

    "preview")
        echo "👀 Предварительный просмотр продакшен сборки..."

        if [ ! -d "dist" ]; then
            echo "📦 Сборка отсутствует. Выполняется сборка..."
            npm run build
        fi

        npm run preview
        ;;

    "install")
        echo "📦 Установка зависимостей..."
        npm install

        if [ ! -f ".env" ]; then
            echo "📄 Создание .env файла..."
            cp .env.example .env
            echo "✅ .env файл создан"
        fi

        echo "✅ Установка завершена"
        ;;

    "docker")
        echo "🐳 Запуск с Docker..."

        if ! command -v docker &> /dev/null; then
            echo "❌ Docker не установлен"
            exit 1
        fi

        # Проверяем Docker Compose (новая и старая версии)
        DOCKER_COMPOSE_CMD=""
        if command -v docker-compose &> /dev/null; then
            DOCKER_COMPOSE_CMD="docker-compose"
        elif docker compose version &> /dev/null; then
            DOCKER_COMPOSE_CMD="docker compose"
        else
            echo "❌ Docker Compose не установлен"
            exit 1
        fi

        echo "🏗️ Сборка и запуск контейнеров..."
        $DOCKER_COMPOSE_CMD up -d

        echo "✅ Приложение запущено в Docker"
        echo "🌐 Frontend: http://localhost:3000"
        echo "🔧 Backend: http://localhost:8000"
        ;;

    "stop")
        echo "⏹️ Остановка Docker контейнеров..."

        # Определяем команду Docker Compose
        DOCKER_COMPOSE_CMD=""
        if command -v docker-compose &> /dev/null; then
            DOCKER_COMPOSE_CMD="docker-compose"
        elif docker compose version &> /dev/null; then
            DOCKER_COMPOSE_CMD="docker compose"
        else
            echo "❌ Docker Compose не найден"
            exit 1
        fi

        $DOCKER_COMPOSE_CMD down
        echo "✅ Контейнеры остановлены"
        ;;

    "clean")
        echo "🧹 Очистка..."
        rm -rf node_modules dist .next
        echo "✅ Очистка завершена"
        ;;

    "lint")
        echo "🔍 Проверка кода..."
        npm run lint
        ;;

    "type-check")
        echo "📝 Проверка типов TypeScript..."
        npx tsc --noEmit
        ;;

    *)
        echo "Использование: $0 {dev|build|preview|install|docker|stop|clean|lint|type-check}"
        echo ""
        echo "Команды:"
        echo "  dev        - запуск в режиме разработки"
        echo "  build      - сборка для продакшена"
        echo "  preview    - предварительный просмотр сборки"
        echo "  install    - установка зависимостей"
        echo "  docker     - запуск с Docker"
        echo "  stop       - остановка Docker контейнеров"
        echo "  clean      - очистка файлов"
        echo "  lint       - проверка кода"
        echo "  type-check - проверка типов"
        echo ""
        echo "Примеры:"
        echo "  $0 dev     # запуск для разработки"
        echo "  $0 build   # сборка для продакшена"
        echo "  $0 docker  # запуск с Docker"
        exit 1
        ;;
esac