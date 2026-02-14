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

**Auth Service** (`services/auth-service/.env`):

Required variables:

- `DATABASE_URL` - Postgres connection string
- `JWT_SECRET` - Secret key for signing tokens
- `JWT_EXPIRES_IN` - Access token lifetime (e.g., "15m")
- `REFRESH_TOKEN_EXPIRES_IN` - Refresh token lifetime (e.g., "7d")
- `CORS_ORIGIN` - Frontend URL for CORS
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` - Google OAuth credentials
- `FRONTEND_URL` - Frontend URL for OAuth redirects

See existing `.env` file for example values.

**Frontend** (create `frontend/.env` if needed):

- `VITE_API_URL` - Auth service URL (default: http://localhost:3001)

### 3. Start Infrastructure

```bash
# Start Postgres
docker-compose up -d

# Verify it's running
docker-compose ps
```

### 4. Database Setup

```bash
cd services/auth-service

# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# (Optional) Seed database
pnpm prisma db seed
```

### 5. Start Development Servers

```bash
# Terminal 1: Auth service
pnpm dev:auth

# Terminal 2: Frontend
pnpm dev:frontend
```

Frontend: http://localhost:5173  
Auth API: http://localhost:3001

## Development Workflow

### Daily Development

```bash
# Start Postgres
docker-compose up -d

# Start services (separate terminals)
pnpm dev:auth
pnpm dev:frontend
```

Hot reload is enabled for both services.

### Database Changes

```bash
cd services/auth-service

# 1. Edit prisma/schema.prisma
# 2. Create migration
pnpm prisma:migrate --name your_migration_name

# View database with Prisma Studio
pnpm prisma:studio  # Opens at http://localhost:5555
```

### Database Reset

```bash
cd services/auth-service

# Option 1: Prisma reset (deletes all data)
pnpm prisma migrate reset

# Option 2: Docker volumes reset
docker-compose down -v
docker-compose up -d
pnpm prisma:migrate
```

## Testing & Quality

### Commands

```bash
# Run tests
pnpm test
pnpm test:auth  # Auth service only

# Linting
pnpm lint
pnpm lint:fix

# Type checking
pnpm type-check

# Formatting
pnpm format
pnpm format:check
```

### Manual Testing

Access auth endpoints at http://localhost:3001:

- POST `/api/auth/signup` - Create account
- POST `/api/auth/login` - Login
- GET `/api/auth/me` - Get current user (requires JWT)
- POST `/api/auth/logout` - Logout
- POST `/api/auth/refresh` - Refresh access token

## Troubleshooting

**Port already in use:**

```bash
lsof -i :3001  # Find process
kill -9 <PID>  # Kill process
```

**Database connection failed:**

```bash
docker-compose ps  # Check Postgres is running
docker-compose logs postgres  # View logs
docker-compose restart postgres  # Restart
```

**Prisma client not generated:**

```bash
cd services/auth-service
pnpm prisma:generate
```

**Module not found after adding package:**

```bash
pnpm install  # Reinstall workspace
```

**Docker not starting:**

```bash
docker-compose down
docker-compose up -d
docker-compose logs -f  # View logs
```
