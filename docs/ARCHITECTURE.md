# Architecture Overview

A learning-focused full-stack application with microservices architecture. Implements user authentication, todo lists, and task management. Built with a React SPA frontend, two Express backend services, three shared packages, and a single Postgres database.

## System Diagram

```
┌─────────────────────────────────┐
│         Browser (React SPA)     │
│  Zustand + React Query + MUI v7 │
└────────────┬──────────┬─────────┘
             │ HTTP     │ HTTP
             ▼          ▼
  ┌──────────────┐  ┌──────────────┐
  │ Auth Service │  │ Todo Service │
  │  (Port 3001) │  │  (Port 3002) │
  └──────┬───────┘  └──────┬───────┘
         │                 │
         └────────┬────────┘
                  ▼
           ┌──────────┐
           │PostgreSQL│
           └──────────┘
```

## Services & Responsibilities

### Auth Service (Port 3001)

Handles user identity and access control. Supports email/password signup/login and Google OAuth. Issues short-lived JWT access tokens (15m) and long-lived refresh tokens (7d) stored in HttpOnly cookies.

### Todo Service (Port 3002)

Handles todo lists and tasks. All routes are protected — requires a valid JWT cookie issued by the auth service. Supports CRUD for lists and tasks, with filtering by list, search, star, and priority.

### Frontend (Port 5173)

React SPA built with Vite, MUI v7, Zustand (client state), and React Query (server state / caching). Communicates with both backend services via two separate Axios instances. Handles routing, auth guarding, and all UI.

## Shared Packages

| Package                      | Purpose                                                         |
| ---------------------------- | --------------------------------------------------------------- |
| `@fs-project/common`         | Shared TypeScript types and enums (used by FE + BE)             |
| `@fs-project/backend-common` | Shared JWT utilities, `authenticate` middleware, error classes  |
| `@fs-project/db`             | Shared Prisma client and schema (single source of truth for DB) |

## Communication & Data Flow

### Authentication Flow

- User submits credentials → Auth Service validates against Postgres
- Returns user data + sets HttpOnly cookies (`accessToken`, `refreshToken`)
- Frontend stores user state in Zustand; never touches tokens directly (XSS protection)
- Any 401 from either service triggers automatic token refresh via `POST /auth/refresh`; concurrent 401s queue and retry after a single refresh

### Todo Data Flow

- Frontend calls Todo Service (`/api/lists`, `/api/todos`) with cookies attached automatically
- Todo Service validates JWT via `authenticate` middleware (`@fs-project/backend-common`)
- Server state is managed by React Query (caching + invalidation); Zustand holds UI-only state (selected list, search term)

## Key Architectural Decisions

- **HttpOnly cookies for tokens**: XSS protection — JavaScript cannot access tokens
- **Shared Postgres database**: All services share one DB instance; schemas are co-located in `packages/db`
- **Shared packages**: `backend-common` and `common` enforce consistent error shapes, types, and auth middleware across services
- **Zustand + React Query split**: Zustand for UI/auth state, React Query for async server data (avoids manual loading/error state boilerplate)
- **Vite over CRA**: 10-30x faster dev server startup and HMR
- **MUI v7**: Material Design components with built-in accessibility

## Non-Goals (Not Covered Here)

This document provides system orientation only. Implementation details are documented elsewhere:

- API endpoint tables, request/response schemas
- Database schemas (Prisma models)
- Environment variables and configuration values
- Docker Compose infrastructure details
- Frontend component patterns and folder structure
- Security implementation details (password hashing, rate limiting)
- Future architecture (Redis, K8s, CI/CD pipelines)
