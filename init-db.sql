-- Создание пользователя и базы данных
DO $$ BEGIN
    CREATE USER "user" WITH PASSWORD 'password';
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'User already exists';
END $$;

CREATE DATABASE rp_server_db OWNER "user";
GRANT ALL PRIVILEGES ON DATABASE rp_server_db TO "user";

-- Подключение к базе данных
\c rp_server_db

-- Предоставление прав на схему public
GRANT ALL ON SCHEMA public TO "user";
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "user";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "user";

-- Установка владельца схемы
ALTER SCHEMA public OWNER TO "user";