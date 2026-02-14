# Coding Conventions

This document defines repo-specific coding standards for this project. All patterns are based on current codebase structure.

## Repository Structure

```
fs-project/
├── services/
│   └── auth-service/          # Authentication microservice
├── frontend/                   # React SPA
├── docs/                       # Documentation
├── docker-compose.yml          # Local infrastructure
├── pnpm-workspace.yaml         # Workspace config
└── tsconfig.json               # Root TS config
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

## Backend (auth-service)

### Folder Structure

```
services/auth-service/src/
├── config/          # Configuration (database, passport)
├── controllers/     # HTTP request handlers
├── middleware/      # Express middleware (auth, validators, errorHandler)
├── repositories/    # Data access layer (Prisma queries)
├── routes/          # API route definitions
├── services/        # Business logic layer
├── types/           # TypeScript type definitions
├── utils/           # Helper functions (errors, jwt, password)
└── index.ts         # Entry point
```

### Layered Architecture Pattern

**Controller → Service → Repository**

Controllers handle HTTP, services contain business logic, repositories access database.

```typescript
// Example: Signup flow
authController.signup()        // Parse request, set cookies, format response
  → authService.signup()       // Hash password, validate business rules
    → userRepository.create()  // Prisma database query
```

### Error Handling

All errors extend `AppError` (see `utils/errors.ts`):

```typescript
// Available error classes:
ValidationError; // 400 - Invalid input
UnauthorizedError; // 401 - Auth required/failed
ForbiddenError; // 403 - No permission
NotFoundError; // 404 - Resource not found
ConflictError; // 409 - Duplicate resource

// Usage in code:
throw new ValidationError('Email is required');
throw new UnauthorizedError('Invalid credentials');
```

Errors are caught by `errorHandler` middleware and returned as JSON.

### Input Validation

Uses `express-validator` (see `middleware/validators.ts`):

```typescript
// Validation chains exported from validators.ts:
validateSignup; // Email, password, fullName
validateLogin; // Email, password
validateRefresh; // No body validation

// Usage in routes:
router.post('/signup', validateSignup, signup);
```

### API Response Format

All endpoints return consistent structure:

```typescript
// Success response:
{ success: true, data: { user: {...} } }

// Error response:
{ success: false, error: { message: "...", code: 400 } }
```

See actual examples in `controllers/authController.ts`.

### Authentication & Cookies

JWT tokens stored in **HttpOnly cookies** (XSS protection):

- `accessToken` - 15 minutes lifetime
- `refreshToken` - 7 days lifetime

Cookie settings: `httpOnly: true`, `secure` (production only), `sameSite: 'strict'`

## Frontend (React)

### Folder Structure

```
frontend/src/
├── pages/           # Page components (LoginPage, SignupPage, DashboardPage)
├── services/        # API clients (api.ts, authService.ts)
├── store/           # Zustand stores (authStore.ts)
├── assets/          # Static assets
├── App.tsx          # Root component
└── main.tsx         # Entry point
```

### API Client Pattern

Base axios instance in `services/api.ts`:

```typescript
// Configured with:
- baseURL: VITE_API_URL env variable
- withCredentials: true  // Sends cookies
- Response interceptor: Transforms errors to ApiError class
```

Service files wrap specific endpoints:

```typescript
// services/authService.ts exports:
login(email, password);
signup(data);
getCurrentUser();
logout();
```

### State Management (Zustand)

Store pattern in `store/authStore.ts`:

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User) => void;
  clearUser: () => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

// Usage:
const { user, isAuthenticated, logout } = useAuthStore();
```

State + actions in same store. No separate actions file.

### Styling (SCSS Modules)

Component-scoped styles:

```typescript
// LoginPage.module.scss
.container { ... }
.form { ... }

// LoginPage.tsx
import styles from './LoginPage.module.scss';
<div className={styles.container}>...</div>
```

Only used for pages so far. MUI components handle most styling.

## Testing

Testing framework configured: **Jest** (in auth-service package.json)

**Current status**: No tests directory exists yet. Tests to be added.

When adding tests, place in:

- Backend: `services/auth-service/__tests__/` or `services/auth-service/src/**/*.test.ts`
- Frontend: `frontend/src/**/*.test.tsx`

## Code Quality Checks

Pre-commit hooks (Husky + lint-staged) run:

- ESLint
- Prettier
- TypeScript type checking

Available commands:

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
- ✅ Use custom error classes from `utils/errors.ts`
- ✅ Validate all user input with `express-validator`
- ✅ Store tokens in HttpOnly cookies only
- ✅ Return consistent API response format (`{ success, data/error }`)
- ✅ Use Zustand for client state
- ✅ Use SCSS modules for component styles

### Don't:

- ❌ Commit `.env` files or secrets
- ❌ Use `any` type without good reason
- ❌ Put business logic in controllers
- ❌ Store JWT in localStorage (XSS risk)
- ❌ Return tokens in API response body
- ❌ Skip input validation
- ❌ Use default exports (prefer named exports)
