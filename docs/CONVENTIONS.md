# Coding Conventions

This document defines repo-specific coding standards for this project. All patterns are based on current codebase structure.

## Repository Structure

```
fs-project/
├── services/
│   ├── auth-service/          # Authentication microservice (port 3001)
│   └── todo-service/          # Todo/list microservice (port 3002)
├── packages/
│   ├── backend-common/        # Shared JWT utils, auth middleware, error classes
│   ├── common/                # Shared TypeScript types/enums (FE + BE)
│   └── db/                    # Shared Prisma client and schema
├── frontend/                  # React SPA
├── scripts/                   # Utility scripts (e.g. init-databases.sh)
├── docs/                      # Documentation
├── docker-compose.yml
└── pnpm-workspace.yaml
```

## TypeScript Standards

### Strictness

This project uses **strict mode** (see `tsconfig.json`):

- `strict: true` - All strict checks enabled
- `noImplicitAny: true` - No implicit any types
- `strictNullChecks: true` - Null safety required
- `noUnusedLocals: true` - No unused variables
- `noImplicitReturns: true` - Explicit returns required

### Naming Conventions

- **PascalCase**: React components, TypeScript interfaces/types (`UserCard.tsx`, `User` type)
- **camelCase**: Functions, variables, files (`authService.ts`, `getUserById`)
- **kebab-case**: Folders, config files (`auth-service/`, `docker-compose.yml`)
- **UPPER_SNAKE_CASE**: Environment variables, constants (`JWT_SECRET`, `MAX_RETRIES`)

## Backend (Both Services)

Both `auth-service` and `todo-service` follow the same folder structure and patterns.

### Folder Structure

```
services/<service>/src/
├── config/          # Configuration (database, passport)
├── controllers/     # HTTP request handlers
├── middleware/      # Express middleware (errorHandler, validators)
├── repositories/    # Data access layer (Prisma queries)
├── routes/          # API route definitions
├── services/        # Business logic layer
├── types/           # TypeScript type definitions
└── index.ts         # Entry point
```

### Layered Architecture Pattern

**Controller → Service → Repository**

Controllers handle HTTP, services contain business logic, repositories access the database.

```typescript
// Example: create todo flow
todoController.create()        // Parse request, format response
  → todoService.create()       // Validate business rules
    → todoRepository.create()  // Prisma database query
```

### Shared Packages (Backend)

- **`@fs-project/backend-common`**: Import `authenticate` middleware for route protection, and error classes (`ValidationError`, `UnauthorizedError`, `NotFoundError`, `ConflictError`, `ForbiddenError`)
- **`@fs-project/common`**: Shared enums and input types (`Priority`, `CreateTodoInput`, etc.)
- **`@fs-project/db`**: Import `prisma` singleton client; never instantiate `PrismaClient` directly in a service

### Error Handling

All errors extend `AppError` (from `@fs-project/backend-common`):

```typescript
throw new ValidationError('Email is required'); // 400
throw new UnauthorizedError('Invalid credentials'); // 401
throw new NotFoundError('Todo not found'); // 404
throw new ConflictError('Email already in use'); // 409
```

Errors are caught by the `errorHandler` middleware and returned as JSON.

### Input Validation

Uses `express-validator` in `middleware/validators.ts`. Validation chains are composed and applied per route.

### API Response Format

```typescript
// Success:
{ success: true, data: { ... } }

// Error:
{ success: false, error: { message: "...", code: 400 } }
```

### Authentication & Cookies

JWT tokens stored in **HttpOnly cookies** (XSS protection):

- `accessToken` — 15 minutes
- `refreshToken` — 7 days

Cookie settings: `httpOnly: true`, `secure` (production only), `sameSite: 'strict'`

## Frontend (React)

### Folder Structure

```
frontend/src/
├── components/      # Reusable UI components (one folder per component)
├── pages/           # Page-level components (LoginPage, TasksPage, etc.)
├── services/        # API clients (api.ts, authService.ts, todoService.ts)
├── store/           # Zustand stores (authStore, taskStore, todoStore)
├── hooks/           # Custom React hooks
├── lib/             # Utilities (e.g. React Query client setup)
├── i18n/            # Internationalization config
├── theme/           # MUI theme configuration
├── assets/          # Static assets
└── main.tsx         # Entry point
```

### API Client Pattern

Two Axios instances in `services/api.ts`:

- `api` — points to auth-service (`VITE_API_URL`, default port 3001)
- `todoApi` — points to todo-service (`VITE_TODO_API_URL`, default port 3002)

Both are configured with `withCredentials: true` and share a single token-refresh interceptor (queues concurrent 401s, calls `POST /auth/refresh` once, then retries).

Service files wrap specific endpoints:

```typescript
// services/authService.ts  → login, signup, getCurrentUser, logout
// services/todoService.ts  → getLists, createList, getTodos, createTodo, updateTodo, deleteTodo
```

### State Management

The frontend uses two complementary tools:

| Tool            | What it manages                                                  |
| --------------- | ---------------------------------------------------------------- |
| **Zustand**     | Client/UI state: auth user, selected list, search term           |
| **React Query** | Server state: todos, lists — with caching and cache invalidation |

Stores in `store/`:

- `authStore` — `user`, `isAuthenticated`, `isLoading`; actions: `checkAuth`, `logout`
- `taskStore` — `selectedListId`, `searchTerm`; UI state only, no API calls
- `todoStore` — `todos`, `lists`; wraps React Query mutations and invalidations

State + actions live in the same store file. No separate actions file.

### Styling

MUI components handle most styling. SCSS Modules (`.module.scss`) are used for page-level layout overrides where MUI is insufficient.

## Testing

Testing framework configured: **Jest** (in auth-service and todo-service `package.json`)

**Current status**: No tests directory exists yet. Tests to be added.

When adding tests, place in:

- Backend: `services/<service>/__tests__/` or `src/**/*.test.ts`
- Frontend: `frontend/src/**/*.test.tsx`

## Code Quality Checks

Pre-commit hooks (Husky + lint-staged) run:

- ESLint
- Prettier
- TypeScript type checking

```bash
pnpm lint          # ESLint check
pnpm lint:fix      # ESLint auto-fix
pnpm format        # Prettier format
pnpm type-check    # TypeScript check
```

## Do's & Don'ts

### Do:

- ✅ Use strict TypeScript types (no `any`)
- ✅ Follow layered architecture (controller → service → repository)
- ✅ Use error classes from `@fs-project/backend-common`
- ✅ Use `prisma` from `@fs-project/db` — never create a new `PrismaClient`
- ✅ Validate all user input with `express-validator`
- ✅ Store tokens in HttpOnly cookies only
- ✅ Return consistent API response format (`{ success, data/error }`)
- ✅ Use Zustand for UI/auth state, React Query for server data

### Don't:

- ❌ Commit `.env` files or secrets
- ❌ Use `any` type without strong justification
- ❌ Put business logic in controllers
- ❌ Store JWT in localStorage (XSS risk)
- ❌ Return tokens in API response body
- ❌ Skip input validation
- ❌ Use default exports (prefer named exports)
- ❌ Instantiate `PrismaClient` directly in a service — use `@fs-project/db`
