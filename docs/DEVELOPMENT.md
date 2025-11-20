# Development Guide

## Prerequisites

### Required Software

- **Node.js** >= 22.0.0 (v22.21.0 recommended) ([Download](https://nodejs.org/))
  - Use nvm: `nvm install 22.21.0 && nvm use 22.21.0`
  - Or check `.nvmrc` in project root
- **pnpm** >= 10.0.0 (`npm install -g pnpm`)
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop/))
- **Git** ([Download](https://git-scm.com/))

### Optional (for K8s development)

- **Minikube** ([Install Guide](https://minikube.sigs.k8s.io/docs/start/))
- **kubectl** ([Install Guide](https://kubernetes.io/docs/tasks/tools/))
- **Postman** or **Insomnia** (API testing)

## Initial Setup

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd fs-project

# Use correct Node version (if using nvm)
nvm use
# Should automatically use Node 22.21.0 from .nvmrc
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
pnpm install
```

### 3. Environment Configuration

Each service needs its own `.env` file:

**Auth Service** (`services/auth-service/.env`):

```bash
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auth_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
CORS_ORIGIN=http://localhost:3000
```

**Frontend** (`frontend/.env`):

```bash
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=Full-Stack Todo App
```

### 4. Start Infrastructure

```bash
# Start PostgreSQL and Redis
pnpm docker:up

# Wait for services to be healthy (check with docker ps)
```

### 5. Run Database Migrations

```bash
# Navigate to auth service
cd services/auth-service

# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev --name init

# (Optional) Seed database
pnpm prisma db seed
```

### 6. Start Development Servers

```bash
# Terminal 1: Auth service
pnpm dev:auth

# Terminal 2: Frontend
pnpm dev:frontend
```

## Development Workflow

### Daily Development

```bash
# 1. Pull latest changes
git pull origin main

# 2. Install any new dependencies
pnpm install

# 3. Start services
pnpm docker:up
pnpm dev:auth    # Terminal 1
pnpm dev:frontend # Terminal 2

# 4. Make changes and test
# Hot reload is enabled for both services

# 5. Run tests before committing
pnpm test
pnpm lint
pnpm type-check
```

### Working with Packages

When modifying shared packages (`packages/common` or `packages/backend-common`):

```bash
# 1. Make changes to package
cd packages/common
# ... edit files ...

# 2. Build the package
pnpm build

# 3. The consuming services will auto-reload
# (watch mode picks up changes in node_modules)
```

### Database Development

#### Creating Migrations

```bash
cd services/auth-service

# 1. Modify schema in prisma/schema.prisma
# 2. Create migration
pnpm prisma migrate dev --name add_user_role

# 3. Prisma will auto-generate client types
```

#### Viewing Database

```bash
# Option 1: Prisma Studio (GUI)
cd services/auth-service
pnpm prisma studio
# Opens at http://localhost:5555

# Option 2: psql CLI
docker exec -it fs-postgres psql -U postgres -d auth_db

# Option 3: pgAdmin or DBeaver (external tools)
```

#### Resetting Database

```bash
cd services/auth-service

# Reset database (CAUTION: Deletes all data)
pnpm prisma migrate reset

# Or manually
docker-compose down -v  # Remove volumes
docker-compose up -d postgres
pnpm prisma migrate dev
```

### Redis Development

#### Viewing Redis Data

```bash
# Connect to Redis CLI
docker exec -it fs-redis redis-cli

# Common commands:
KEYS *                    # List all keys
GET session:123          # Get specific key
SCAN 0 MATCH session:*   # Find keys by pattern
FLUSHDB                  # Clear database (CAUTION)
TTL session:123          # Check time-to-live
```

#### Redis GUI (Optional)

- [RedisInsight](https://redis.com/redis-enterprise/redis-insight/) - Free Redis GUI
- [Medis](https://getmedis.com/) - macOS Redis client

## Testing

### Unit Tests

```bash
# Run all tests
pnpm test

# Run tests for specific service
pnpm --filter auth-service test

# Watch mode
pnpm --filter auth-service test:watch

# Coverage
pnpm test:coverage
```

### API Testing with Postman

1. **Import Collection**
   - Open Postman
   - Import `docs/postman/auth-service.postman_collection.json`
   - Import `docs/postman/environment.json`

2. **Test Flow**

   ```
   1. POST /api/auth/signup (creates user)
   2. POST /api/auth/login (returns JWT)
   3. GET /api/auth/me (use JWT from step 2)
   4. POST /api/auth/logout
   ```

3. **Environment Variables**
   - `BASE_URL`: http://localhost:3001
   - `ACCESS_TOKEN`: Auto-set after login

### Manual Testing Checklist

**Auth Service:**

- [ ] Signup with valid email/password
- [ ] Signup with duplicate email (should fail)
- [ ] Login with correct credentials
- [ ] Login with wrong password (should fail)
- [ ] Access protected route with valid JWT
- [ ] Access protected route without JWT (should fail)
- [ ] Logout and verify session cleared
- [ ] Refresh token before expiration

**Frontend:**

- [ ] Signup form validation
- [ ] Login form validation
- [ ] Redirect to dashboard after login
- [ ] Display user name in header
- [ ] Logout clears state and redirects
- [ ] Protected routes redirect to login
- [ ] Responsive design (mobile/tablet/desktop)

## Debugging

### Backend Debugging (VSCode)

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Auth Service",
      "cwd": "${workspaceFolder}/services/auth-service",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["dev"],
      "skipFiles": ["<node_internals>/**"],
      "envFile": "${workspaceFolder}/services/auth-service/.env"
    }
  ]
}
```

### Frontend Debugging

- Use React DevTools browser extension
- Use Zustand DevTools (already configured)
- Browser console for errors
- Network tab for API calls

### Docker Debugging

```bash
# View logs
docker-compose logs -f auth-service
docker-compose logs -f postgres

# Exec into container
docker exec -it fs-auth-service sh
docker exec -it fs-postgres psql -U postgres

# Restart specific service
docker-compose restart auth-service

# Check container health
docker ps
docker inspect fs-postgres
```

### Common Issues

#### Port Already in Use

```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>
```

#### Database Connection Failed

```bash
# Check Postgres is running
docker ps | grep postgres

# Check connection string in .env
# Verify DATABASE_URL format

# Restart Postgres
docker-compose restart postgres
```

#### Prisma Client Not Generated

```bash
cd services/auth-service
pnpm prisma generate
```

#### Redis Connection Issues

```bash
# Test Redis connection
docker exec -it fs-redis redis-cli PING
# Should return "PONG"
```

#### Module Not Found (after adding package)

```bash
# Rebuild workspace
pnpm install

# Clear pnpm cache if needed
pnpm store prune
```

## Code Quality

### Linting

```bash
# Lint all code
pnpm lint

# Auto-fix issues
pnpm lint:fix

# Lint specific service
pnpm --filter auth-service lint
```

### Type Checking

```bash
# Check all TypeScript
pnpm type-check

# Watch mode
pnpm type-check:watch
```

### Formatting

```bash
# Format with Prettier
pnpm format

# Check formatting
pnpm format:check
```

### Pre-commit Hooks

Husky is configured to run checks before commits:

- ESLint
- Prettier
- TypeScript type checking
- Unit tests

## Performance Profiling

### Backend Performance

```bash
# Use Node.js built-in profiler
node --inspect services/auth-service/dist/index.js

# Or use clinic.js
npx clinic doctor -- node services/auth-service/dist/index.js
```

### Frontend Performance

- Use React DevTools Profiler
- Chrome DevTools Performance tab
- Lighthouse audits

## Database Optimization

### Query Analysis

```sql
-- Explain query plan
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

-- Check slow queries
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

### Indexes

```prisma
// Add indexes in schema.prisma
model User {
  id    String @id @default(uuid())
  email String @unique

  @@index([email]) // Composite index example
}
```

## Git Workflow

### Branch Naming

```
feature/add-google-oauth
fix/login-validation-bug
refactor/auth-middleware
docs/update-readme
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(auth): add password reset endpoint
fix(frontend): resolve login redirect issue
docs(readme): update installation steps
refactor(db): optimize user query
test(auth): add unit tests for signup
```

### Pull Request Process

1. Create feature branch
2. Make changes with atomic commits
3. Run tests: `pnpm test && pnpm lint`
4. Push and create PR
5. Wait for CI/CD checks to pass
6. Request review
7. Address feedback
8. Merge to main

## Helpful Scripts

```bash
# Clean everything
pnpm clean              # Remove dist/ and node_modules/
pnpm clean:db           # Reset database
pnpm clean:cache        # Clear all caches

# Build
pnpm build              # Build all packages
pnpm build:auth         # Build auth service only

# Docker
pnpm docker:build       # Build all images
pnpm docker:clean       # Remove containers and volumes

# Database
pnpm db:reset           # Reset database
pnpm db:seed            # Seed test data
pnpm db:studio          # Open Prisma Studio

# Kubernetes (Minikube)
pnpm k8s:start          # Start Minikube
pnpm k8s:deploy         # Deploy services
pnpm k8s:logs           # View logs
pnpm k8s:destroy        # Delete cluster
```

## Resources

### Documentation

- [Prisma Docs](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [React Documentation](https://react.dev/)
- [MUI Components](https://mui.com/material-ui/getting-started/)
- [Zustand Guide](https://docs.pmnd.rs/zustand/getting-started/introduction)

### Tutorials

- [Prisma with PostgreSQL](https://www.prisma.io/docs/getting-started/setup-prisma/start-from-scratch/relational-databases-typescript-postgresql)
- [JWT Authentication](https://www.digitalocean.com/community/tutorials/nodejs-jwt-expressjs)
- [Docker Compose](https://docs.docker.com/compose/gettingstarted/)
- [Kubernetes Basics](https://kubernetes.io/docs/tutorials/kubernetes-basics/)

## Getting Help

- Check [docs/ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Check [docs/CONVENTIONS.md](./CONVENTIONS.md) for coding standards
- Search existing GitHub issues
- Check Docker/Kubernetes logs
- Use debugger breakpoints
