-- Инициализация базы данных для РП Сервер
-- Создается автоматически при запуске PostgreSQL контейнера

-- Создание расширений
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Создание индексов для производительности (будут созданы автоматически Alembic)
-- Этот файл нужен только для дополнительных настроек БД

-- Настройки для оптимизации
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.track = 'all';

-- Логирование медленных запросов (больше 1 секунды)
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';

-- Применение настроек
SELECT pg_reload_conf();

-- Информация о создании
INSERT INTO pg_stat_statements_info (dealloc) VALUES (0) ON CONFLICT DO NOTHING;

-- Создание пользователя для приложения (если еще не создан)
DO $$ 
BEGIN
    -- Пользователь создается автоматически в docker-compose
    RAISE NOTICE 'Database initialized successfully for RP Server';
END $$;