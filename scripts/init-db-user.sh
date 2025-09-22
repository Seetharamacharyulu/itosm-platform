#!/bin/bash
# PostgreSQL database initialization script
# This runs automatically when the database container starts for the first time
# via docker-entrypoint-initdb.d

set -e

echo "Creating application database user with least privileges..."

# Create application user with environment password
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create application user if not exists
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${APP_DB_USER}') THEN
            CREATE ROLE ${APP_DB_USER} WITH LOGIN PASSWORD '${APP_DB_PASSWORD}';
            RAISE NOTICE 'Created application user: ${APP_DB_USER}';
        ELSE
            ALTER ROLE ${APP_DB_USER} WITH PASSWORD '${APP_DB_PASSWORD}';
            RAISE NOTICE 'Updated password for application user: ${APP_DB_USER}';
        END IF;
    END
    \$\$;

    -- Secure the database and public schema
    REVOKE CONNECT ON DATABASE ${POSTGRES_DB} FROM PUBLIC;
    REVOKE CREATE ON SCHEMA public FROM PUBLIC;
    
    -- Grant minimal required permissions for application
    GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO ${APP_DB_USER};
    
    -- Grant schema access (read-only for app, migrations handle CREATE)
    GRANT USAGE ON SCHEMA public TO ${APP_DB_USER};
    
    -- Grant permissions on ALL existing tables and sequences
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${APP_DB_USER};
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${APP_DB_USER};
    
    -- Grant permissions on future tables and sequences
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${APP_DB_USER};
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${APP_DB_USER};

EOSQL

echo "Application user ${APP_DB_USER} configured successfully with least privileges"