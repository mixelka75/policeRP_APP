#!/bin/bash
# setup.sh - Скрипт первоначальной настройки РП Сервер

set -e

echo "🔧 Настройка РП Сервер - Система управления"
echo "==========================================="

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_color() {
    printf "${2}${1}${NC}\n"
}

# Проверка прав
if [[ $EUID -eq 0 ]]; then
   print_color "❌ Не запускайте этот скрипт от имени root" $RED
   exit 1
fi

# Проверка команд
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_color "❌ $1 не найден" $RED
        return 1
    else
        print_color "✅ $1 найден: $(command -v $1)" $GREEN
        return 0
    fi
}

# Проверка системных зависимостей
print_color "🔍 Проверка системных зависимостей..." $BLUE
MISSING_DEPS=""

if ! check_command "docker"; then
    MISSING_DEPS="${MISSING_DEPS}docker "
fi

if ! docker compose version &> /dev/null; then
    MISSING_DEPS="${MISSING_DEPS}docker-compose "
fi

if ! check_command "curl"; then
    MISSING_DEPS="${MISSING_DEPS}curl "
fi

if ! check_command "git"; then
    MISSING_DEPS="${MISSING_DEPS}git "
fi

if [ ! -z "$MISSING_DEPS" ]; then
    print_color "❌ Отсутствуют зависимости: $MISSING_DEPS" $RED
    echo ""
    print_color "Для установки на Ubuntu/Debian:" $BLUE
    echo "sudo apt update"
    echo "sudo apt install docker.io docker-compose curl git"
    echo "sudo usermod -aG docker \$USER"
    echo ""
    print_color "Для установки на CentOS/RHEL:" $BLUE
    echo "sudo yum install docker docker-compose curl git"
    echo "sudo systemctl start docker"
    echo "sudo usermod -aG docker \$USER"
    echo ""
    print_color "Для установки на macOS:" $BLUE
    echo "brew install docker docker-compose curl git"
    echo ""
    print_color "После установки перезагрузите систему или выполните:" $YELLOW
    echo "newgrp docker"
    exit 1
fi

# Проверка Docker
print_color "🐳 Проверка Docker..." $BLUE
if ! docker info &> /dev/null; then
    print_color "❌ Docker не запущен или нет прав доступа" $RED
    print_color "Попробуйте:" $YELLOW
    echo "sudo systemctl start docker"
    echo "sudo usermod -aG docker \$USER"
    echo "newgrp docker"
    exit 1
else
    print_color "✅ Docker работает корректно" $GREEN
fi

# Проверка структуры проекта
print_color "📁 Проверка структуры проекта..." $BLUE

REQUIRED_DIRS=("backend" "frontend" "nginx")
REQUIRED_FILES=("docker-compose.yml" "start.sh")

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        print_color "❌ Папка $dir не найдена" $RED
        exit 1
    fi
done

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        print_color "❌ Файл $file не найден" $RED
        exit 1
    fi
done

print_color "✅ Структура проекта корректна" $GREEN

# Создание необходимых директорий
print_color "📂 Создание необходимых директорий..." $BLUE
mkdir -p logs
mkdir -p backups
mkdir -p nginx/ssl
mkdir -p monitoring

# Создание файлов настроек из примеров
print_color "⚙️  Создание файлов настроек..." $BLUE

if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        print_color "✅ Файл backend/.env создан из примера" $GREEN
    else
        print_color "⚠️  Файл backend/.env.example не найден, создаем базовый .env" $YELLOW
        cat > backend/.env << 'EOF'
DATABASE_URL=postgresql://rp_user:rp_password@database:5432/rp_server_db
SECRET_KEY=super-secret-key-change-in-production
DEBUG=false
PROJECT_NAME=RP Server Backend
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ACCESS_TOKEN_EXPIRE_MINUTES=30
EOF
    fi
else
    print_color "✅ Файл backend/.env уже существует" $GREEN
fi

if [ ! -f "frontend/.env" ]; then
    if [ -f "frontend/.env.example" ]; then
        cp frontend/.env.example frontend/.env
        print_color "✅ Файл frontend/.env создан из примера" $GREEN
    else
        print_color "⚠️  Файл frontend/.env.example не найден, создаем базовый .env" $YELLOW
        cat > frontend/.env << 'EOF'
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=РП Сервер
VITE_APP_VERSION=1.0.0
EOF
    fi
else
    print_color "✅ Файл frontend/.env уже существует" $GREEN
fi

# Создание SSL сертификатов для разработки
if [ ! -f "nginx/ssl/cert.pem" ] || [ ! -f "nginx/ssl/key.pem" ]; then
    print_color "🔐 Создание SSL сертификатов для разработки..." $BLUE
    if command -v openssl &> /dev/null; then
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/key.pem \
            -out nginx/ssl/cert.pem \
            -subj "/C=RU/ST=Moscow/L=Moscow/O=RP Server/CN=localhost" 2>/dev/null
        print_color "✅ SSL сертификаты созданы" $GREEN
    else
        print_color "⚠️  OpenSSL не найден, SSL сертификаты не созданы" $YELLOW
    fi
fi

# Создание конфигурации мониторинга
print_color "📊 Создание конфигурации мониторинга..." $BLUE
cat > monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'
    scrape_interval: 30s
EOF

# Создание дополнительных скриптов
print_color "📝 Создание дополнительных скриптов..." $BLUE

# Скрипт быстрого запуска
cat > quick-start.sh << 'EOF'
#!/bin/bash
echo "🚀 Быстрый запуск РП Сервер"
echo "=========================="
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Логин: admin"
echo "Пароль: admin123"
echo ""
echo "Запуск системы..."
./start.sh start
EOF
chmod +x quick-start.sh

# Скрипт разработчика
cat > dev.sh << 'EOF'
#!/bin/bash
echo "🔧 Режим разработки РП Сервер"
echo "============================="
echo ""
echo "Запуск в режиме разработки с hot-reload..."
./start.sh dev
EOF
chmod +x dev.sh

# Скрипт очистки
cat > clean.sh << 'EOF'
#!/bin/bash
echo "🧹 Очистка РП Сервер"
echo "===================="
echo ""
read -p "Удалить ВСЕ данные включая базу данных? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ./start.sh clean
    echo "✅ Система очищена"
else
    echo "❌ Операция отменена"
fi
EOF
chmod +x clean.sh

print_color "✅ Дополнительные скрипты созданы" $GREEN

# Проверка версий Docker
print_color "🐳 Информация о Docker:" $BLUE
docker --version
docker-compose --version

# Создание .gitignore если его нет
if [ ! -f ".gitignore" ]; then
    print_color "📄 Создание .gitignore..." $BLUE
    cat > .gitignore << 'EOF'
# Environment variables
.env
.env.local
.env.production

# Logs
*.log
logs/

# Database
*.db
*.sqlite
*.sqlite3

# Docker
docker-compose.override.yml

# Backups
backups/

# SSL certificates (development only)
nginx/ssl/*.pem
nginx/ssl/*.key

# OS
.DS_Store
.DS_Store?
._*
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Node.js
node_modules/

# Python
__pycache__/
*.pyc
venv/

# Temporary files
tmp/
temp/
*.tmp
*.temp
EOF
    print_color "✅ .gitignore создан" $GREEN
fi

# Финальная проверка
print_color "🧪 Финальная проверка..." $BLUE

# Проверка что Docker Compose файл валиден
if docker compose config &> /dev/null; then
    print_color "✅ Docker Compose конфигурация валидна" $GREEN
else
    print_color "❌ Ошибка в Docker Compose конфигурации" $RED
    docker compose config
    exit 1
fi

# Итоговая информация
print_color "" $NC
print_color "🎉 Настройка завершена успешно!" $GREEN
print_color "================================" $GREEN
print_color "" $NC
print_color "Доступные команды:" $BLUE
print_color "  ./quick-start.sh    - Быстрый запуск" $GREEN
print_color "  ./dev.sh            - Режим разработки" $GREEN
print_color "  ./start.sh start    - Обычный запуск" $GREEN
print_color "  ./start.sh stop     - Остановка" $GREEN
print_color "  ./start.sh logs     - Просмотр логов" $GREEN
print_color "  ./start.sh status   - Статус системы" $GREEN
print_color "  ./clean.sh          - Очистка данных" $GREEN
print_color "" $NC
print_color "URL после запуска:" $BLUE
print_color "  Frontend: http://localhost:3000" $GREEN
print_color "  Backend:  http://localhost:8000" $GREEN
print_color "  API Docs: http://localhost:8000/docs" $GREEN
print_color "" $NC
print_color "Учетные данные по умолчанию:" $BLUE
print_color "  Логин:    admin" $GREEN
print_color "  Пароль:   admin123" $GREEN
print_color "" $NC
print_color "Для быстрого старта выполните:" $YELLOW
print_color "  ./quick-start.sh" $GREEN
print_color "" $NC
print_color "🚀 Готово к работе!" $GREEN