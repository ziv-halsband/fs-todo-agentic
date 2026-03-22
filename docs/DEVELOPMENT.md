# Development Guide

## Prerequisites

- **Node.js** >= 22.0.0 (v22.21.0 specified in `.nvmrc`)
- **pnpm** >= 10.0.0 (`npm install -g pnpm`)
- **Docker Desktop** — required for running Postgres locally

## Run Modes

There are two ways to run the project locally. Pick one.

### Mode 1 — Full local (recommended for active development)

Everything runs as local processes. Only Postgres runs in Docker.

```
Browser → Frontend :5173 (pnpm dev)
              ↓
       Auth Service :3001 (pnpm dev, tsx watch — instant hot reload)
       Todo Service :3002 (pnpm dev, tsx watch — instant hot reload)
              ↓
       Postgres :5432 (Docker container)
```

### Mode 2 — Services in Docker (closer to production)

Frontend runs locally; services and Postgres run as Docker containers.

```
Browser → Frontend :5173 (pnpm dev)
              ↓  (ports already mapped by docker-compose)
       Auth Service :3001 (Docker container)
       Todo Service :3002 (Docker container)
              ↓
       Postgres :5432 (Docker container)
```

Start with: `docker compose up -d` (starts all three containers).  
For file-watch rebuilds: `make watch` — Docker Desktop 4.24+ watches `services/*/src` and rebuilds the container on change. This is a **full container rebuild** (slower than Mode 1's instant tsx hot reload).

---

## First-Time Setup (Mode 1)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd fs-project

nvm use          # use correct Node version (requires nvm)
pnpm install     # install all workspace dependencies
```

### 2. Environment Files

Copy the example files and fill in any missing values.

| File                         | Used by                           |
| ---------------------------- | --------------------------------- |
| `.env`                       | `packages/db` Prisma CLI commands |
| `services/auth-service/.env` | Auth service at runtime           |
| `services/todo-service/.env` | Todo service at runtime           |
| `frontend/.env` (optional)   | Override default API URLs         |

Frontend defaults (no `.env` needed unless overriding):

- Auth service: `http://localhost:3001`
- Todo service: `http://localhost:3002`

### 3. Start Postgres

```bash
docker compose up -d postgres
```

### 4. Build the db package + run migrations

This must be done once after cloning, and again after any schema change.

```bash
cd packages/db

# Step 1: generate the Prisma client (creates src/generated/prisma/)
pnpm generate

# Step 2: compile + copy generated files to dist/
# (Node.js loads from dist/, not src/)
pnpm build

# Step 3: apply migrations to the database
pnpm migrate:deploy
```

Why all three steps? See [ARCHITECTURE.md](./ARCHITECTURE.md) and the `@fs-project/db` section.

### 5. Start Development Servers

Open three terminals:

```bash
# Terminal 1 — Auth service (port 3001)
cd services/auth-service && pnpm dev

# Terminal 2 — Todo service (port 3002)
cd services/todo-service && pnpm dev

# Terminal 3 — Frontend (port 5173)
cd frontend && pnpm dev
```

Or start all in parallel from the root:

```bash
pnpm dev:all
```

**URLs:**

- Frontend: http://localhost:5173
- Auth API: http://localhost:3001
- Todo API: http://localhost:3002

---

## Daily Development (Mode 1)

```bash
# 1. Make sure Postgres is running
docker compose up -d postgres

# 2. Start all services
pnpm dev:all
```

Hot reload is enabled for all services — save a file, the service restarts instantly.

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

**Prisma client not found / `Cannot find module './generated/prisma'`:**

```bash
cd packages/db
pnpm generate   # regenerate the client into src/generated/
pnpm build      # compile + copy to dist/ — this is what Node.js actually loads
```

Both steps are required. `generate` alone is not enough for runtime.

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
