FROM node:18-alpine

WORKDIR /app

# Копирование файлов зависимостей
COPY package*.json ./

# Установка зависимостей
RUN npm ci --only=production

# Копирование исходного кода
COPY . .

# Открытие порта
EXPOSE 3000

# Команда запуска в режиме разработки
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]