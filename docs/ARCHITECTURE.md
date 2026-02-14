# Architecture Overview

A learning-focused full-stack application demonstrating microservices architecture patterns. Currently implements authentication service with JWT-based auth, React frontend, and Postgres database. Built as a foundation for expanding into multi-service architecture with container orchestration and CI/CD.

## System Diagram

```
┌─────────────┐
│   Browser   │
│  (React UI) │
└──────┬──────┘
       │ HTTP
       ▼
┌─────────────┐
│    Auth     │
│   Service   │
│  (Port 3001)│
└──────┬──────┘
       │
       ▼
  ┌──────────┐
  │PostgreSQL│
  └──────────┘
```

## Services & Responsibilities

### Auth Service (Port 3001)

Handles user identity and access control. Supports email/password signup/login and Google OAuth. Issues short-lived JWT access tokens (15m) and long-lived refresh tokens (7d) stored in HttpOnly cookies. Enforces role-based access control (USER, EDITOR, ADMIN).

### Frontend (Port 5173)

React SPA built with Vite, MUI v7, and Zustand for state management. Handles UI/UX, client-side routing, and API communication. Uses SCSS modules for component styling.

## Communication & Data Flow

### Authentication Flow

- User submits credentials → Auth service validates against Postgres
- Returns user data + sets HttpOnly cookies (access + refresh tokens)
- Frontend stores user state in Zustand, never touches tokens directly (XSS protection)
- Expired tokens trigger automatic refresh via `/auth/refresh`

### Protected API Requests

- Browser auto-sends cookies with every request
- Backend middleware validates JWT from cookie
- If expired: frontend refreshes token and retries

## Key Architectural Decisions

- **HttpOnly cookies for tokens**: XSS protection (JavaScript cannot access tokens)
- **Shared Postgres database**: All services use same database instance for simplicity in learning environment
- **Zustand over Redux**: Minimal boilerplate, simpler API, smaller bundle size
- **Vite over CRA**: 10-30x faster dev server startup and hot module replacement
- **MUI v7**: Modern Material Design components with built-in accessibility

## Non-Goals (Not Covered Here)

This document provides system orientation only. Implementation details are documented elsewhere:

- API endpoint tables, request/response schemas
- Database schemas (Prisma models)
- Environment variables and configuration values
- Docker Compose infrastructure details
- Frontend component patterns, folder structure
- Security implementation details (password hashing, rate limiting)
- Future architecture (additional services, Redis, K8s, CI/CD pipelines)
