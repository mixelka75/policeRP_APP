-- Initialization script for PostgreSQL database
-- This script sets up the initial database structure and data

-- Create database if not exists (this might not work in all environments)
-- SELECT 'CREATE DATABASE rp_server_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'rp_server_db');

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'police');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE gender_type AS ENUM ('male', 'female');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance (will be created by Alembic, but here as reference)
-- CREATE INDEX IF NOT EXISTS idx_passports_nickname ON passports(nickname);
-- CREATE INDEX IF NOT EXISTS idx_passports_age ON passports(age);
-- CREATE INDEX IF NOT EXISTS idx_fines_passport_id ON fines(passport_id);
-- CREATE INDEX IF NOT EXISTS idx_fines_amount ON fines(amount);
-- CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);
-- CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);

-- Create full-text search indexes
-- CREATE INDEX IF NOT EXISTS idx_passports_search ON passports USING gin((first_name || ' ' || last_name || ' ' || nickname) gin_trgm_ops);
-- CREATE INDEX IF NOT EXISTS idx_fines_search ON fines USING gin(article gin_trgm_ops);

-- Setup for automated backups (if needed)
-- CREATE OR REPLACE FUNCTION backup_database()
-- RETURNS void AS $$
-- BEGIN
--     PERFORM pg_notify('backup_request', NOW()::text);
-- END;
-- $$ LANGUAGE plpgsql;

-- Initial data will be inserted by the application on startup
-- This includes the admin user and any default configuration