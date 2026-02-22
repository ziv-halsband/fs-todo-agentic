# Development Guide

## Prerequisites

- **Node.js** >= 22.0.0 (v22.21.0 specified in `.nvmrc`)
- **pnpm** >= 10.0.0 (`npm install -g pnpm`)
- **Docker Desktop** for running Postgres

## Initial Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd fs-project

# Use correct Node version (if using nvm)
nvm use

# Install dependencies
pnpm install
```

### 2. Environment Configuration

**Root `.env`** (used by `packages/db` Prisma commands):

- `DATABASE_URL` - Postgres connection string

**Auth Service** (`services/auth-service/.env`):

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `REFRESH_TOKEN_EXPIRES_IN`
- `CORS_ORIGIN`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- `FRONTEND_URL`

**Todo Service** (`services/todo-service/.env`):

- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGIN`

**Frontend** (`frontend/.env`):

- `VITE_API_URL` - Auth service URL (default: `http://localhost:3001`)
- `VITE_TODO_API_URL` - Todo service URL (default: `http://localhost:3002`)

### 3. Start Infrastructure

```bash
# Start Postgres
docker-compose up -d

# Verify it's running
docker-compose ps
```

### 4. Database Setup

Prisma schema and migrations live in `packages/db`.

```bash
cd packages/db

# Generate Prisma client
pnpm generate

# Run migrations
pnpm migrate:dev
```

### 5. Start Development Servers

```bash
# Option A: all services in parallel (recommended)
pnpm dev:all

# Option B: separate terminals
pnpm dev:auth        # Auth service (port 3001)
pnpm --filter todo-service dev   # Todo service (port 3002)
pnpm dev:frontend    # Frontend (port 5173)
```

Frontend: http://localhost:5173  
Auth API: http://localhost:3001  
Todo API: http://localhost:3002

## Development Workflow

### Daily Development

```bash
# Start Postgres
docker-compose up -d

# Start all services
pnpm dev:all
```

Hot reload is enabled for all services.

### Database Changes

Schema and migrations are in `packages/db/prisma/`.

```bash
cd packages/db

# 1. Edit prisma/schema.prisma
# 2. Create and apply migration
pnpm migrate:dev -- --name your_migration_name
```

### Database Reset

```bash
cd packages/db

# Option 1: Prisma reset (deletes all data)
pnpm migrate:reset

# Option 2: Docker volumes reset
docker-compose down -v
docker-compose up -d
pnpm migrate:dev
```

## Testing & Quality

```bash
# Run tests
pnpm test
pnpm test:auth

# Linting
pnpm lint
pnpm lint:fix

# Type checking
pnpm type-check

# Formatting
pnpm format
pnpm format:check
```

## Troubleshooting

**Port already in use:**

```bash
lsof -i :3001  # Find process
kill -9 <PID>  # Kill process
```

**Database connection failed:**

```bash
docker-compose ps          # Check Postgres is running
docker-compose logs postgres
docker-compose restart postgres
```

**Prisma client not generated:**

```bash
cd packages/db
pnpm generate
```

**Module not found after adding package:**

```bash
pnpm install  # Reinstall workspace
```

**Docker not starting:**

```bash
docker-compose down
docker-compose up -d
docker-compose logs -f
```
