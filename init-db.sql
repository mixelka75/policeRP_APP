-- Инициализация базы данных для RP Server
-- Выполняется при первом запуске PostgreSQL контейнера

-- Создание необходимых расширений
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Создание индексов для лучшей производительности поиска
-- (эти индексы будут созданы автоматически Alembic, но здесь для справки)

-- Настройки для логирования
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Настройки подключений
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';

-- Применение настроек
SELECT pg_reload_conf();

-- Информационное сообщение
DO $$
BEGIN
    RAISE NOTICE 'RP Server database initialized successfully!';
    RAISE NOTICE 'Database: rp_server_db';
    RAISE NOTICE 'User: rp_user';
    RAISE NOTICE 'Ready for Alembic migrations...';
END $$;