-- ITOSM Platform Database Initialization Script
-- This script sets up the initial database structure and seed data

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create application-specific database user (SECURITY: Least privilege principle)
-- Note: Password will be set via environment variable in startup script
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'itosm_app') THEN
        -- User will be created by init script with environment password
        RAISE NOTICE 'Application user will be created by startup script';
    END IF;
END $$;

-- Set timezone
SET timezone = 'UTC';

-- Create initial admin user (will be handled by application)
-- The application will create tables via Drizzle migrations

-- Insert default software catalog entries (if tables exist)
-- This will be executed after Drizzle creates the tables
-- INSERT INTO software_catalog (name, version) VALUES 
-- ('Microsoft Office', '2021'),
-- ('Adobe Photoshop', '2023'),
-- ('Visual Studio Code', 'Latest'),
-- ('AutoCAD', '2024'),
-- ('Slack', 'Latest'),
-- ('Chrome', 'Latest'),
-- ('Firefox', 'Latest'),
-- ('Zoom', 'Latest'),
-- ('Teams', 'Latest'),
-- ('Adobe Acrobat', '2023')
-- ON CONFLICT (name, version) DO NOTHING;

-- Create health check function
CREATE OR REPLACE FUNCTION health_check()
RETURNS text AS $$
BEGIN
    RETURN 'Database is healthy at ' || now();
END;
$$ LANGUAGE plpgsql;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'ITOSM Platform database initialization completed successfully at %', now();
END $$;