#!/bin/bash
# setup.sh - Скрипт первоначальной настройки РП Сервер

set -e

echo "🔧 Настройка РП Сервер - Система управления"
echo "==========================================="

# Проверяем права на выполнение
if [[ $EUID -eq 0 ]]; then
   echo "❌ Не запускайте этот скрипт от имени root"
   exit 1
fi

# Функция для проверки команд
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 не найден"
        return 1
    else
        echo "✅ $1 найден: $(command -v $1)"
        return 0
    fi
}

# Проверка системных зависимостей
echo "🔍 Проверка системных зависимостей..."
MISSING_DEPS=""

if ! check_command "node"; then
    MISSING_DEPS="${MISSING_DEPS}node "
fi

if ! check_command "npm"; then
    MISSING_DEPS="${MISSING_DEPS}npm "
fi

if ! check_command "python3"; then
    MISSING_DEPS="${MISSING_DEPS}python3 "
fi

if ! check_command "pip3"; then
    MISSING_DEPS="${MISSING_DEPS}pip3 "
fi

# Проверка версий
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo "⚠️  Node.js версия $(node --version) < 18. Рекомендуется обновить."
    fi
fi

if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
    if [ "$(echo "$PYTHON_VERSION < 3.11" | bc -l)" -eq 1 ]; then
        echo "⚠️  Python версия $(python3 --version) < 3.11. Рекомендуется обновить."
    fi
fi

if [ ! -z "$MISSING_DEPS" ]; then
    echo "❌ Отсутствуют зависимости: $MISSING_DEPS"
    echo ""
    echo "Для установки на Ubuntu/Debian:"
    echo "sudo apt update"
    echo "sudo apt install nodejs npm python3 python3-pip python3-venv"
    echo ""
    echo "Для установки на macOS:"
    echo "brew install node python3"
    echo ""
    echo "Для Windows:"
    echo "Скачайте Node.js с https://nodejs.org"
    echo "Скачайте Python с https://python.org"
    exit 1
fi

# Проверка структуры проекта
echo ""
echo "📁 Проверка структуры проекта..."

if [ ! -d "backend" ]; then
    echo "❌ Папка backend не найдена"
    exit 1
fi

if [ ! -d "frontend" ]; then
    echo "❌ Папка frontend не найдена"
    exit 1
fi

if [ ! -f "backend/requirements.txt" ]; then
    echo "❌ backend/requirements.txt не найден"
    exit 1
fi

if [ ! -f "frontend/package.json" ]; then
    echo "❌ frontend/package.json не найден"
    exit 1
fi

echo "✅ Структура проекта корректна"

# Настройка бэкенда
echo ""
echo "🐍 Настройка бэкенда..."

cd backend/

# Создание виртуального окружения
if [ ! -d "venv" ]; then
    echo "📦 Создание виртуального окружения..."
    python3 -m venv venv
fi

# Активация виртуального окружения
echo "🔄 Активация виртуального окружения..."
source venv/bin/activate

# Установка зависимостей
echo "📦 Установка зависимостей Python..."
pip install --upgrade pip
pip install -r requirements.txt

# Создание файла настроек
if [ ! -f ".env" ]; then
    echo "⚙️  Создание файла настроек бэкенда..."
    cp .env.example .env
    echo "✅ Файл backend/.env создан"
else
    echo "✅ Файл backend/.env уже существует"
fi

# Возвращаемся в корневую папку
cd ..

# Настройка фронтенда
echo ""
echo "⚛️  Настройка фронтенда..."

cd frontend/

# Установка зависимостей
echo "📦 Установка зависимостей Node.js..."
npm install

# Создание файла настроек
if [ ! -f ".env" ]; then
    echo "⚙️  Создание файла настроек фронтенда..."
    cp .env.example .env
    echo "✅ Файл frontend/.env создан"
else
    echo "✅ Файл frontend/.env уже существует"
fi

# Возвращаемся в корневую папку
cd ..

# Создание исполняемых скриптов
echo ""
echo "🔧 Настройка скриптов..."

# Делаем скрипты исполняемыми
chmod +x setup.sh
chmod +x start.sh

# Создание симлинков для удобства
echo "#!/bin/bash" > run-backend.sh
echo "cd backend && source venv/bin/activate && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload" >> run-backend.sh
chmod +x run-backend.sh

echo "#!/bin/bash" > run-frontend.sh
echo "cd frontend && npm run dev" >> run-frontend.sh
chmod +x run-frontend.sh

echo "#!/bin/bash" > run-both.sh
echo "echo '🚀 Запуск бэкенда и фронтенда...'" >> run-both.sh
echo "echo 'Бэкенд будет доступен на http://localhost:8000'" >> run-both.sh
echo "echo 'Фронтенд будет доступен на http://localhost:3000'" >> run-both.sh
echo "echo 'Для остановки нажмите Ctrl+C в обоих терминалах'" >> run-both.sh
echo "echo ''" >> run-both.sh
echo "echo 'Запуск бэкенда в фоне...'" >> run-both.sh
echo "cd backend && source venv/bin/activate && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &" >> run-both.sh
echo "BACKEND_PID=\$!" >> run-both.sh
echo "sleep 3" >> run-both.sh
echo "echo 'Запуск фронтенда...'" >> run-both.sh
echo "cd frontend && npm run dev" >> run-both.sh
echo "echo 'Остановка бэкенда...'" >> run-both.sh
echo "kill \$BACKEND_PID" >> run-both.sh
chmod +x run-both.sh

echo "✅ Скрипты созданы:"
echo "  - run-backend.sh  - запуск только бэкенда"
echo "  - run-frontend.sh - запуск только фронтенда"
echo "  - run-both.sh     - запуск обеих частей"

# Проверка опциональных зависимостей
echo ""
echo "🔍 Проверка дополнительных инструментов..."

if command -v docker &> /dev/null; then
    echo "✅ Docker найден: $(docker --version)"

    if command -v docker-compose &> /dev/null; then
        echo "✅ Docker Compose найден: $(docker-compose --version)"
    else
        echo "⚠️  Docker Compose не найден. Установите для использования контейнеров."
    fi
else
    echo "⚠️  Docker не найден. Установите для использования контейнеров."
fi

if command -v git &> /dev/null; then
    echo "✅ Git найден: $(git --version)"
else
    echo "⚠️  Git не найден. Рекомендуется установить для версионного контроля."
fi

# Финальная проверка
echo ""
echo "🧪 Финальная проверка..."

# Проверка что бэкенд может импортировать модули
echo "Проверка бэкенда..."
cd backend/
source venv/bin/activate
if python -c "from app.main import app; print('✅ Бэкенд готов к работе')" 2>/dev/null; then
    echo "✅ Бэкенд прошел проверку"
else
    echo "❌ Проблемы с бэкендом. Проверьте зависимости."
fi
cd ..

# Проверка что фронтенд может собраться
echo "Проверка фронтенда..."
cd frontend/
if npm run build > /dev/null 2>&1; then
    echo "✅ Фронтенд прошел проверку"
    rm -rf dist  # Удаляем тестовую сборку
else
    echo "❌ Проблемы с фронтендом. Проверьте зависимости."
fi
cd ..

# Итоговая информация
echo ""
echo "🎉 Настройка завершена!"
echo "====================="
echo ""
echo "Доступные команды:"
echo "  ./run-backend.sh   - запуск бэкенда"
echo "  ./run-frontend.sh  - запуск фронтенда"
echo "  ./run-both.sh      - запуск обеих частей"
echo "  ./start.sh dev     - запуск в режиме разработки"
echo "  ./start.sh build   - сборка для продакшена"
echo "  ./start.sh docker  - запуск в Docker"
echo ""
echo "URLs после запуска:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo "Логин по умолчанию: admin / admin123"
echo ""
echo "Для быстрого старта выполните:"
echo "  ./run-both.sh"
echo ""
echo "Для получения помощи:"
echo "  ./start.sh help"

# Создание .gitignore в корне если его нет
if [ ! -f ".gitignore" ]; then
    echo "📄 Создание .gitignore..."
    cat > .gitignore << 'EOF'
# Logs
*.log
logs/

# Runtime data
*.pid
*.seed
*.pid.lock

# Environment variables
.env
.env.local
.env.production

# OS generated files
.DS_Store
.DS_Store?
._*
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
ENV/

# Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
dist/
build/

# Database
*.db
*.sqlite
*.sqlite3

# Temporary files
tmp/
temp/
*.tmp
*.temp

# Docker
docker-compose.override.yml
EOF
    echo "✅ .gitignore создан"
fi

echo ""
echo "🚀 Все готово к работе!"