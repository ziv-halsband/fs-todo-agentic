# Architecture Overview

## System Design

### High-Level Architecture

```
┌─────────────┐
│   Browser   │
│  (React UI) │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────┐
│  Load Balancer  │
│   (K8s Ingress) │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌──────────┐
│  Auth   │ │  Todo    │
│ Service │ │ Service  │
└────┬────┘ └────┬─────┘
     │           │
     └─────┬─────┘
           │
      ┌────┴────┐
      │         │
      ▼         ▼
 ┌─────────┐ ┌───────┐
 │PostgreSQL│ │ Redis │
 └──────────┘ └───────┘
```

## Services

### Auth Service (Port 3001)

**Responsibilities:**

- User registration and authentication
- Password hashing and validation
- JWT token generation and validation
- Session management with Redis
- User profile management
- Role-based access control (RBAC)

**Database Schema:**

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sessions table (Redis for performance)
Key: session:{userId}:{sessionId}
Value: {
  userId: string,
  token: string,
  expiresAt: number,
  userAgent: string,
  ipAddress: string
}
TTL: 7 days
```

**API Endpoints:**

| Method | Endpoint                    | Description        | Auth Required |
| ------ | --------------------------- | ------------------ | ------------- |
| POST   | `/api/auth/signup`          | Register new user  | No            |
| POST   | `/api/auth/login`           | Authenticate user  | No            |
| POST   | `/api/auth/logout`          | Invalidate session | Yes           |
| GET    | `/api/auth/me`              | Get current user   | Yes           |
| POST   | `/api/auth/refresh`         | Refresh JWT token  | Yes           |
| PATCH  | `/api/auth/profile`         | Update profile     | Yes           |
| POST   | `/api/auth/change-password` | Change password    | Yes           |

**Environment Variables:**

```bash
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/auth_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
CORS_ORIGIN=http://localhost:3000
```

### Todo Service (Port 3002) - Phase 2

**Responsibilities:**

- CRUD operations for todos
- Todo sharing and collaboration
- Permission management (RBAC)
- Real-time updates
- Activity logging

**Database Schema:**

```sql
-- Todos table
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(50) DEFAULT 'medium',
  owner_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  due_date TIMESTAMP
);

-- Todo permissions (for sharing)
CREATE TABLE todo_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id UUID NOT NULL REFERENCES todos(id),
  user_id UUID NOT NULL REFERENCES users(id),
  role VARCHAR(50) NOT NULL, -- 'owner', 'editor', 'viewer'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(todo_id, user_id)
);
```

## Frontend Application (Port 3000)

**Architecture:**

- Component-based architecture
- Container/Presentational pattern
- Custom hooks for business logic
- Zustand for global state
- React Query for server state (future)

**Directory Structure:**

```
frontend/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── auth/         # Auth-related components
│   │   ├── common/       # Buttons, inputs, etc.
│   │   └── layout/       # Layout components
│   ├── pages/            # Page components
│   │   ├── LoginPage/
│   │   ├── SignupPage/
│   │   └── DashboardPage/
│   ├── store/            # Zustand stores
│   │   └── authStore.ts
│   ├── services/         # API services
│   │   └── api.ts
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Helper functions
│   ├── types/            # TypeScript types
│   ├── styles/           # Global styles
│   └── App.tsx
```

## Data Flow

### Authentication Flow

```
1. User submits login form
   ↓
2. Frontend sends POST /api/auth/login
   ↓
3. Auth service validates credentials
   ↓
4. Auth service generates JWT token
   ↓
5. Auth service creates session in Redis
   ↓
6. Auth service returns tokens + user data
   ↓
7. Frontend stores tokens in memory/localStorage
   ↓
8. Frontend updates Zustand auth store
   ↓
9. User redirected to dashboard
```

### Protected API Request Flow

```
1. Frontend makes API request with JWT in Authorization header
   ↓
2. Backend middleware validates JWT
   ↓
3. Backend middleware checks session in Redis
   ↓
4. If valid: Process request
   If invalid: Return 401 Unauthorized
   ↓
5. If 401: Frontend refreshes token or redirects to login
```

## Shared Packages

### @fs-project/common

**Purpose:** Shared types and utilities for all services

**Exports:**

```typescript
// Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

// Constants
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
};

// Utilities
export function validateEmail(email: string): boolean;
export function formatDate(date: Date): string;
```

### @fs-project/backend-common

**Purpose:** Shared backend utilities, middleware, and clients

**Exports:**

```typescript
// Database clients
export class PrismaClient {
  /* ... */
}
export class RedisClient {
  /* ... */
}

// Middleware
export function authMiddleware(req, res, next);
export function errorHandler(err, req, res, next);
export function validateRequest(schema);

// Utilities
export class Logger {
  /* ... */
}
export function generateJWT(payload): string;
export function verifyJWT(token): Payload;
export function hashPassword(password): Promise<string>;
export function comparePassword(password, hash): Promise<boolean>;
```

## Infrastructure

### Docker Compose (Local Development)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports: ['5432:5432']
    volumes: [postgres_data:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    ports: ['6379:6379']

  auth-service:
    build: ./services/auth-service
    ports: ['3001:3001']
    depends_on: [postgres, redis]

  frontend:
    build: ./frontend
    ports: ['3000:3000']
    depends_on: [auth-service]
```

### Kubernetes (Minikube/EKS)

**Namespaces:**

- `dev` - Development environment
- `prod` - Production environment

**Resources per Service:**

- Deployment (2-3 replicas)
- Service (ClusterIP for internal, LoadBalancer for external)
- ConfigMap (environment variables)
- Secret (sensitive data)
- HorizontalPodAutoscaler (auto-scaling)

**Storage:**

- StatefulSet for PostgreSQL
- StatefulSet for Redis
- PersistentVolumeClaim for data persistence

## Security Considerations

### Authentication & Authorization

- JWT tokens with short expiration (15 minutes)
- Refresh tokens stored in HTTP-only cookies (7 days)
- Session validation in Redis on every request
- Password requirements: min 8 chars, 1 uppercase, 1 number, 1 special
- Rate limiting on auth endpoints (5 attempts per 15 minutes)

### Data Protection

- Passwords hashed with bcrypt (10 rounds)
- Environment variables for secrets
- Kubernetes secrets for production
- CORS configuration (whitelist origins)
- SQL injection prevention with Prisma

### Network Security

- HTTPS only in production
- API Gateway/Ingress controller
- Private subnets for databases
- Security groups in AWS
- Network policies in K8s

## Monitoring & Logging (Future)

- Winston/Pino for structured logging
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Prometheus + Grafana for metrics
- AWS CloudWatch
- Error tracking with Sentry
- Distributed tracing with Jaeger

## Scalability Considerations

### Horizontal Scaling

- Stateless services (scale easily)
- Session data in Redis (shared across instances)
- Load balancer distributes traffic
- K8s HPA based on CPU/memory

### Database Optimization

- Indexes on frequently queried columns
- Connection pooling with Prisma
- Read replicas for read-heavy operations
- Caching with Redis

### Performance

- Response compression (gzip)
- Static asset CDN
- Database query optimization
- Lazy loading in frontend
- Code splitting
- Image optimization

## Disaster Recovery

- Automated database backups (daily)
- Point-in-time recovery
- Multi-AZ deployment in AWS
- Infrastructure as Code (Terraform)
- GitOps with ArgoCD
- Rollback strategies
