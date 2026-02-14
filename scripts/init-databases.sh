#!/bin/bash
set -e

# This script runs when Postgres container starts for the first time
# It creates multiple databases for different microservices

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create auth-service database
    CREATE DATABASE auth_db;
    
    -- Create todo-service database
    CREATE DATABASE todo_db;
    
    -- Grant all privileges (optional, postgres user already has them)
    GRANT ALL PRIVILEGES ON DATABASE auth_db TO postgres;
    GRANT ALL PRIVILEGES ON DATABASE todo_db TO postgres;
EOSQL

echo "✅ Multiple databases created successfully!"
