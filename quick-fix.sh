#!/bin/bash
# quick-fix.sh - Быстрое исправление и перезапуск

set -e

echo "🔧 Быстрое исправление Docker конфигурации..."

# Остановка всех контейнеров
echo "⏹️ Остановка контейнеров..."
docker compose down --remove-orphans 2>/dev/null || true
docker-compose down --remove-orphans 2>/dev/null || true

# Очистка Docker кэша
echo "🧹 Очистка Docker кэша..."
docker system prune -f

# Проверка и создание недостающих файлов
echo "📁 Проверка файлов..."

# Создаем .env файлы если их нет
if [ ! -f "backend/.env" ]; then
    echo "📄 Создание backend/.env..."
    cp backend/.env.example backend/.env
fi

if [ ! -f "frontend/.env" ]; then
    echo "📄 Создание frontend/.env..."
    cp frontend/.env.example frontend/.env
fi

# Создаем недостающие директории
echo "📁 Создание директорий..."
mkdir -p frontend/src/components/ui
mkdir -p frontend/src/pages
mkdir -p frontend/src/store
mkdir -p frontend/src/services
mkdir -p frontend/src/types
mkdir -p frontend/src/utils
mkdir -p frontend/src/hooks

# Проверяем vite.config.ts
if [ ! -f "frontend/vite.config.ts" ]; then
    echo "📄 Создание frontend/vite.config.ts..."
    cat > frontend/vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
        },
      },
    },
  },
})
EOF
fi

# Исправляем backend/Dockerfile
echo "🔧 Исправление backend/Dockerfile..."
if [ -f "backend/Dockerfile" ]; then
    sed -i 's/CMD \["python", "-m", "uvicorn", "main:app"/CMD ["python", "-m", "uvicorn", "app.main:app"/g' backend/Dockerfile
fi

# Создаем базовый index.tsx для UI компонентов если его нет
if [ ! -f "frontend/src/components/ui/index.tsx" ]; then
    echo "📄 Создание базовых UI компонентов..."
    cat > frontend/src/components/ui/index.tsx << 'EOF'
import React from 'react';

export const Loading: React.FC<{ text?: string }> = ({ text = "Загрузка..." }) => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    <span className="ml-2 text-gray-400">{text}</span>
  </div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <button
    className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors ${className}`}
    {...props}
  >
    {children}
  </button>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { error?: string }> = ({
  className = '',
  error,
  ...props
}) => (
  <div>
    <input
      className={`w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none ${className}`}
      {...props}
    />
    {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
  </div>
);

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => (
  <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
    {children}
  </div>
);
EOF
fi

# Пересборка и запуск
echo "🔨 Пересборка контейнеров..."
docker compose build --no-cache

echo "🚀 Запуск сервисов..."
docker compose up -d

echo "⏳ Ожидание запуска сервисов..."
sleep 15

# Проверка статуса
echo "📊 Проверка статуса сервисов:"
docker compose ps

echo ""
echo "🌐 Проверка доступности:"

# Проверка backend
echo -n "Backend (8000): "
sleep 5
if curl -f http://localhost:8000/health &>/dev/null; then
    echo "✅ Работает"
else
    echo "❌ Недоступен - проверьте логи: docker compose logs backend"
fi

# Проверка frontend
echo -n "Frontend (3000): "
sleep 5
if curl -f http://localhost:3000 &>/dev/null; then
    echo "✅ Работает"
else
    echo "❌ Недоступен - проверьте логи: docker compose logs frontend"
fi

echo ""
echo "📋 Полезные команды:"
echo "  docker compose logs backend    # Логи бэкенда"
echo "  docker compose logs frontend   # Логи фронтенда"
echo "  docker compose logs postgres   # Логи базы данных"
echo "  docker compose restart         # Перезапуск всех сервисов"
echo "  docker compose down            # Остановка всех сервисов"

echo ""
echo "🎉 Исправление завершено!"
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo "Логин:    admin / admin123"