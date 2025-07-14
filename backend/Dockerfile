# Dockerfile для бэкенда
FROM python:3.11-slim

# Установка системных зависимостей
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    curl \
    wait-for-it \
    && rm -rf /var/lib/apt/lists/*

# Создание рабочей директории
WORKDIR /app

# Копирование requirements.txt
COPY requirements.txt .

# Установка Python зависимостей
RUN pip install --no-cache-dir -r requirements.txt

# Копирование всего кода
COPY . .

# Создание скрипта entrypoint
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Создание директории для логов
RUN mkdir -p logs

# Создание пользователя
RUN adduser --disabled-password --gecos '' appuser
RUN chown -R appuser:appuser /app

USER appuser

# Открытие порта
EXPOSE 8000

# Точка входа
ENTRYPOINT ["docker-entrypoint.sh"]

# Команда по умолчанию
CMD ["python3", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]