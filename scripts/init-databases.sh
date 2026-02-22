#!/bin/bash
set -e

# Creates the single shared application database.
# All services (auth, todo, ...) share one DB and one Prisma schema
# managed by packages/db.

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE app_db;
    GRANT ALL PRIVILEGES ON DATABASE app_db TO postgres;
EOSQL

echo "✅ app_db created successfully!"
