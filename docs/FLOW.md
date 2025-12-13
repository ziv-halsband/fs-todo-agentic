# Project Implementation Flow

**Purpose:** Track step-by-step implementation progress for learning and reference.

---

## ✅ Phase 1: Project Setup & Configuration

### 1. Project Initialization

- [x] Created monorepo with pnpm workspace
- [x] Setup workspace structure (`services/`, `packages/`, `frontend/`)
- [x] Added `.nvmrc` (Node v22.21.0)
- [x] Created initial `package.json` with workspace config

### 2. Documentation

- [x] Created `README.md` (project overview)
- [x] Created `docs/ARCHITECTURE.md` (system design)
- [x] Created `docs/CONVENTIONS.md` (coding standards)
- [x] Created `docs/DEVELOPMENT.md` (dev guide)
- [x] Created `docs/COLLABORATION_RULES.md` (learning approach)

### 3. Code Quality Tools

- [x] **Prettier** - Code formatting
  - `.prettierrc` (format rules)
  - `.prettierignore` (skip files)
  - Scripts: `format`, `format:check`

- [x] **ESLint** - Code linting
  - `.eslintrc.json` (lint rules)
  - `.eslintignore` (skip files)
  - Scripts: `lint`, `lint:fix`
  - Configured for TypeScript + async Express handlers

- [x] **TypeScript** - Type checking
  - Root `tsconfig.json` (base config)
  - Service-specific `services/auth-service/tsconfig.json`
  - Script: `type-check`

- [x] **EditorConfig** - Editor consistency
  - `.editorconfig` (tabs, line endings, etc.)

### 4. Git Configuration

- [x] **Git Ignore**
  - `.gitignore` (comprehensive rules)
- [x] **Pre-Commit Hooks** (Husky + lint-staged)
  - Installed `husky` and `lint-staged`
  - `.husky/pre-commit` (runs lint-staged)
  - Auto-format and lint on commit
  - Tested and verified working

### 5. Service Structure

- [x] Created `services/auth-service/` structure
  - `src/` (source code)
    - `config/`, `controllers/`, `middleware/`
    - `repositories/`, `routes/`, `services/`
    - `types/`, `utils/`
  - `prisma/` (database schema)
  - Test `index.ts` (Express hello world)

---

## ✅ Phase 2: Auth Service - Database Setup (COMPLETED)

### 1. Prisma Schema

- [x] Created `prisma/schema.prisma`
  - User model (id, email, passwordHash, fullName, avatarUrl, role, isVerified)
  - UserRole enum (USER, ADMIN, EDITOR)
  - Configured PostgreSQL datasource
  - Added indexes and constraints

### 2. Environment Configuration

- [x] Created `.env` with all required variables
  - Application config (NODE_ENV, PORT)
  - Database URL (PostgreSQL - localhost for local, container name for Docker)
  - JWT secrets and expiry (15min access, 7d refresh)
  - BCRYPT rounds (10)
  - CORS origin

### 3. Docker Setup

- [x] Created `docker-compose.yml` (Postgres + Redis)
- [x] Configured Docker profiles (infra, services, full)
- [x] Started Postgres container (port 5432)
- [x] Verified database connection

### 4. Database Migrations

- [x] Ran `prisma migrate dev --name init`
- [x] Generated Prisma Client
- [x] Created users table with proper schema
- [x] Fixed migration location (.env in correct directory)

---

## ✅ Phase 3: Auth Service - Core Logic (COMPLETED)

### 1. Utilities (`src/utils/`)

- [x] **Password utilities** (`password.ts`)
  - `hashPassword()` - bcrypt with 10 rounds
  - `comparePassword()` - verify password
  - `validatePasswordStrength()` - min 8 chars, uppercase, lowercase, number, special char

- [x] **JWT utilities** (`jwt.ts`)
  - `generateAccessToken()` - 15min expiry
  - `generateRefreshToken()` - 7 days expiry
  - `verifyToken()` - validate JWT
  - `extractTokenFromHeader()` - parse Bearer token
  - Fixed TypeScript errors with `expiresIn` type

- [x] **Custom Errors** (`errors.ts`)
  - `AppError` - base class
  - `ValidationError` (400)
  - `UnauthorizedError` (401)
  - `ForbiddenError` (403)
  - `NotFoundError` (404)
  - `ConflictError` (409)

### 2. Repository Layer (`src/repositories/`)

- [x] **User Repository** (`userRepository.ts`)
  - `findByEmail()` - lookup by email
  - `findById()` - lookup by ID
  - `create()` - create new user
  - `update()` - update user data
  - `delete()` - remove user
  - `emailExists()` - check if email taken
  - `SafeUser` type - omits passwordHash
  - Proper error handling for Prisma errors (P2002, P2025)

### 3. Service Layer (`src/services/`)

- [x] **Auth Service** (`authService.ts`)
  - `signup()` - validate password strength, check email, hash password, create user, generate tokens
  - `login()` - verify credentials, generate tokens
  - `getCurrentUser()` - fetch user by ID
  - `refreshToken()` - validate refresh token, generate new access token
  - `logout()` - return success (stateless JWT, no Redis yet)
  - Discussed security implications (role in signup, JWT logout problem)

---

## ✅ Phase 4: Auth Service - API Routes (COMPLETED)

### 1. Middleware (`src/middleware/`)

- [x] **Request Validation** (`validators.ts`)
  - `validateSignup` - email format, password presence, fullName length
  - `validateLogin` - email and password presence
  - `validateRefreshToken` - token presence
  - Uses `express-validator` library
  - `handleValidationErrors` - centralized error collection

- [x] **Authentication** (`auth.ts`)
  - `authenticate` - verify JWT from cookie OR Authorization header
  - `optionalAuth` - non-required auth (for public/private hybrid routes)
  - Extracts user info and attaches to `req.user`
  - Supports both browser (cookies) and API (headers)

- [x] **Error Handler** (`errorHandler.ts`)
  - Catches all errors from routes/controllers
  - Distinguishes operational (AppError) vs programming errors
  - Returns consistent JSON error format
  - Shows stack trace in development mode

### 2. Controllers (`src/controllers/`)

- [x] **Auth Controller** (`authController.ts`)
  - `signup` - create user, set HttpOnly cookies
  - `login` - authenticate, set HttpOnly cookies
  - `getMe` - return current user (protected route)
  - `refresh` - refresh access token from cookie
  - `logout` - clear HttpOnly cookies
  - Cookie config: `httpOnly: true`, `secure: production`, `sameSite: strict`

### 3. Routes (`src/routes/`)

- [x] **Auth Routes** (`authRoutes.ts`)
  - `POST /auth/signup` - public, with validation
  - `POST /auth/login` - public, with validation
  - `GET /auth/me` - protected (requires authentication)
  - `POST /auth/refresh` - public (requires refresh token in cookie)
  - `POST /auth/logout` - protected
  - Properly layered: Route → Validator → Auth → Controller

### 4. Main Application (`src/index.ts`)

- [x] Express server setup
- [x] Middleware: CORS (with credentials), JSON parser, cookie-parser
- [x] Routes: `/health` and `/auth/*`
- [x] Error handler (must be last)
- [x] Server listening on port 3001

---

## ✅ Phase 5: Docker & Testing (COMPLETED)

### 1. Dockerization

- [x] Created multi-stage `Dockerfile` for auth-service
  - Stages: base, dependencies, build-context, development, builder, production
  - Optimized for pnpm monorepo (workspace-aware)
  - Proper caching layers
- [x] Updated `docker-compose.yml` with auth-service
- [x] Built and tested Docker image
- [x] Verified Docker networking

### 2. Native Module Issues

- [x] Fixed bcrypt compilation issue
  - Created `.npmrc` to enable build scripts
  - Rebuilt bcrypt native modules
  - Used `pnpm install --force` to recompile

### 3. Development Workflow

- [x] Decided on hybrid approach: Infra in Docker, services local
- [x] Docker Compose profiles for flexibility
- [x] Running auth-service locally with `pnpm dev`
- [x] Postgres running in Docker (port 5432)

### 4. Endpoint Testing

- [x] **All endpoints tested and working:**
  - ✅ `GET /health` - returns OK
  - ✅ `POST /auth/signup` - creates user, sets cookies
  - ✅ `POST /auth/login` - authenticates, sets cookies
  - ✅ `GET /auth/me` - returns user (with cookie), fails without
  - ✅ `POST /auth/refresh` - refreshes access token
  - ✅ `POST /auth/logout` - clears cookies
  - ✅ Validation tests (invalid email, weak password, duplicate email, wrong password)

---

## ✅ Phase 6: Google OAuth (COMPLETED)

### What Was Done:

- [x] Installed Passport.js + passport-google-oauth20
- [x] Configured Google Cloud Console (OAuth credentials)
- [x] Updated Prisma schema (provider, providerId fields)
- [x] Created migration (add_oauth_support)
- [x] Built Passport Google strategy (config/passport.ts)
- [x] Added findOrCreateOAuthUser() to auth service
- [x] Created OAuth controller (googleCallback, oauthError)
- [x] Added OAuth routes (/auth/google, /auth/google/callback)
- [x] Tested complete OAuth flow ✅

### Key Files:

```
src/config/passport.ts       - Google OAuth strategy
src/controllers/oauthController.ts  - OAuth handlers
src/routes/oauthRoutes.ts    - OAuth endpoints
src/services/authService.ts  - findOrCreateOAuthUser()
```

### Security:

- OAuth users created without password (passwordHash = null)
- Conflict detection (can't use same email with different providers)
- HttpOnly cookies for JWT tokens
- Automatic user creation from Google profile

---

## 📋 Phase 7: Frontend (TODO - NEXT!)

### 1. Setup

- [ ] Create React app
- [ ] Setup MUI + SCSS
- [ ] Configure routing

### 2. Auth Pages

- [ ] Login page
- [ ] Signup page
- [ ] Protected routes

### 3. Integration

- [ ] Connect to auth-service API
- [ ] Test E2E flow

---

## 📋 Phase 8: Advanced Features (TODO)

- [ ] Email verification
- [ ] Password reset
- [ ] Todo service
- [ ] API Gateway
- [ ] CI/CD pipeline
- [ ] AWS deployment
- [ ] Kubernetes setup
- [ ] Redis session tracking

---

## Key Learnings

### Configuration Files

- **Why each tool:** Prettier (format), ESLint (quality), TypeScript (safety)
- **Auto-fix vs manual:** ESLint can fix some issues, not all
- **Pre-commit hooks:** Catch issues before they reach Git

### Prisma

- **Schema structure:** generator, datasource, models, enums
- **Annotations:** `@id`, `@unique`, `@map`, `@default`, `@updatedAt`
- **Why UUID over auto-increment:** Security, distribution, merging
- **Database vs TypeScript naming:** snake_case vs camelCase
- **Migration lock:** Ensures migration consistency across environments

### Security Best Practices

- **HttpOnly cookies:** JavaScript can't access (XSS protection)
- **SameSite=Strict:** Prevents CSRF attacks
- **Secure flag:** HTTPS only in production
- **Short-lived tokens:** 15min access, 7d refresh
- **Password hashing:** bcrypt with 10 rounds
- **JWT verification:** Each service can verify independently (shared secret)

### Architecture Decisions

- **Self-verifying services:** Each service verifies JWT without calling Auth Service (fast, scalable)
- **API Gateway:** Will be added later for centralized routing (Pattern 2 - Gateway verifies JWT locally)
- **Stateless JWT:** Tokens valid until expiration (trade-off: can't immediately revoke)
- **Hybrid approach:** Infra in Docker, services local (faster iteration)

### Error Handling

- **Custom error classes:** Extend Error with statusCode
- **Centralized error handler:** Last middleware catches all errors
- **Operational vs Programming errors:** AppError vs unexpected errors
- **Type safety:** Changed from `any` to `unknown` with type guards

### Best Practices

- **One thing at a time:** Focus and understand before moving on
- **Why over what:** Understand reasoning, not just implementation
- **Environment variables:** Never commit secrets
- **Layered architecture:** Repository → Service → Controller → Route
- **Type annotations:** Explicit types for exports (portable types)

---

**Last Updated:** Phase 6 - Google OAuth Complete ✅
**Next Step:** Phase 7 - Frontend (Vite + React + MUI + Zustand)
