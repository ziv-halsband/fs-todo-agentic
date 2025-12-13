# Architecture Overview

## 📋 Current Implementation Status

| Component        | Status      | Details                             |
| ---------------- | ----------- | ----------------------------------- |
| **Auth Service** | ✅ Complete | Email/password + Google OAuth       |
| **Database**     | ✅ Complete | Postgres with Prisma, OAuth support |
| **Docker Infra** | ✅ Complete | Postgres on Docker Compose          |
| **Frontend**     | ⏭️ Next     | Vite + React + MUI + Zustand        |
| **Todo Service** | ⏭️ Planned  | After frontend auth                 |
| **Deployment**   | ⏭️ Planned  | After frontend E2E test             |

---

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

### Auth Service (Port 3001) ✅ IMPLEMENTED

**Responsibilities:**

- User registration (email/password)
- User authentication (email/password + Google OAuth)
- Password hashing with bcrypt
- JWT token generation and validation
- HttpOnly cookie-based token storage (XSS protection)
- Role-based access control (RBAC)

**Current Status:**

- ✅ Email/password signup & login
- ✅ Google OAuth login
- ✅ JWT in HttpOnly cookies
- ⏭️ Redis session tracking (future)
- ⏭️ Password reset (future)
- ⏭️ Email verification (future)

**Database Schema (Prisma):**

```prisma
model User {
  id           String       @id @default(uuid())
  email        String       @unique
  passwordHash String?      @map("password_hash")  // Nullable for OAuth users
  fullName     String       @map("full_name")
  avatarUrl    String?      @map("avatar_url")
  role         UserRole     @default(USER)
  isVerified   Boolean      @default(true) @map("is_verified")
  provider     AuthProvider @default(EMAIL)        // EMAIL, GOOGLE
  providerId   String?      @map("provider_id")    // Google user ID
  createdAt    DateTime     @default(now()) @map("created_at")
  updatedAt    DateTime     @updatedAt @map("updated_at")

  @@map("users")
  @@unique([provider, providerId])
}

enum UserRole { USER, EDITOR, ADMIN }
enum AuthProvider { EMAIL, GOOGLE }
```

**API Endpoints:**

| Method | Endpoint                | Description               | Auth Required |
| ------ | ----------------------- | ------------------------- | ------------- |
| GET    | `/health`               | Health check              | No            |
| POST   | `/auth/signup`          | Register (email/password) | No            |
| POST   | `/auth/login`           | Login (email/password)    | No            |
| GET    | `/auth/me`              | Get current user          | Yes           |
| POST   | `/auth/refresh`         | Refresh access token      | No (cookie)   |
| POST   | `/auth/logout`          | Clear cookies             | Yes           |
| GET    | `/auth/google`          | Start Google OAuth        | No            |
| GET    | `/auth/google/callback` | Google OAuth callback     | No            |

**Security Features:**

```
✅ HttpOnly cookies - JavaScript can't access tokens (XSS protection)
✅ SameSite=strict - CSRF protection
✅ Secure flag in production - HTTPS only
✅ Short-lived access tokens - 15 minutes
✅ Long-lived refresh tokens - 7 days
✅ Password hashing - bcrypt with 10 rounds
✅ Input validation - express-validator
```

**Environment Variables:**

```bash
# Application
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auth_db?schema=public

# JWT
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Password Hashing
BCRYPT_ROUNDS=10

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback

# Frontend
FRONTEND_URL=http://localhost:3000
```

**Code Architecture (Layered):**

```
Request → Routes → Middleware → Controller → Service → Repository → Database
                     ↑
                (Validation)
                     ↑
                (Auth check)
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

### Tech Stack

| Category             | Choice             | Why                                                |
| -------------------- | ------------------ | -------------------------------------------------- |
| **Build Tool**       | Vite               | Instant dev server, fast builds, modern ES modules |
| **UI Library**       | MUI v5             | Pre-built components, theming, TypeScript support  |
| **Styling**          | SCSS + CSS Modules | Scoped styles, no naming conflicts, co-located     |
| **State Management** | Zustand            | Minimal boilerplate, simple API, tiny bundle       |
| **HTTP Client**      | Axios              | Automatic JSON, interceptors, industry standard    |
| **Routing**          | React Router v6    | Industry standard, nested routes                   |
| **TypeScript**       | Yes                | Type safety, better DX                             |

### Why These Choices?

**Vite over Create-React-App:**

```
CRA:  Start dev server → Bundle ALL files → Serve (30-60s)
Vite: Start dev server → Serve on-demand → Bundle when needed (1-2s)
```

**Zustand over Redux:**

```typescript
// Redux: 50+ lines of boilerplate
// Zustand: 10 lines!
const useAuthStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
```

**CSS Modules over regular SCSS:**

```scss
// LoginForm.module.scss
.container {
  padding: 20px;
}

// Compiles to: .LoginForm_container_x7h3k (unique, no conflicts!)
```

### Architecture Patterns

- **Component-based**: Reusable, isolated UI components
- **Feature-based folders**: Related files co-located together
- **Custom hooks**: Encapsulate business logic
- **Store pattern**: Global state with Zustand

### Directory Structure

```
frontend/
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── common/             # Shared components
│   │   │   └── Button/
│   │   │       ├── Button.tsx
│   │   │       ├── Button.module.scss
│   │   │       ├── Button.types.ts
│   │   │       └── index.ts
│   │   ├── auth/               # Auth-specific components
│   │   │   └── LoginForm/
│   │   │       ├── LoginForm.tsx
│   │   │       ├── LoginForm.module.scss
│   │   │       ├── parts/      # Private sub-components
│   │   │       │   └── EmailInput.tsx
│   │   │       └── index.ts
│   │   └── layout/             # Layout components
│   │       ├── Header/
│   │       ├── Footer/
│   │       └── Sidebar/
│   │
│   ├── pages/                   # Route pages (one per URL)
│   │   ├── Login/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── LoginPage.module.scss
│   │   │   └── index.ts
│   │   ├── Signup/
│   │   └── Dashboard/
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.ts          # Auth state & actions
│   │   ├── useApi.ts           # API call wrapper
│   │   └── useLocalStorage.ts  # LocalStorage wrapper
│   │
│   ├── store/                   # Zustand stores
│   │   ├── authStore.ts        # Auth state (user, tokens)
│   │   └── uiStore.ts          # UI state (modals, toasts)
│   │
│   ├── services/                # API layer
│   │   ├── api.ts              # Base fetch/axios setup
│   │   └── authService.ts      # Auth API calls
│   │
│   ├── types/                   # Shared TypeScript types
│   │   ├── auth.types.ts
│   │   └── api.types.ts
│   │
│   ├── utils/                   # Helper functions
│   │   ├── formatters.ts
│   │   └── validators.ts
│   │
│   ├── styles/                  # Global styles
│   │   ├── _variables.scss     # Colors, spacing, fonts
│   │   ├── _mixins.scss        # Reusable SCSS mixins
│   │   ├── _reset.scss         # CSS reset
│   │   └── global.scss         # Global styles
│   │
│   ├── App.tsx                  # Main app with routes
│   ├── main.tsx                 # Entry point
│   └── vite-env.d.ts           # Vite TypeScript types
│
├── public/                      # Static assets (favicon, etc.)
├── index.html                   # HTML template
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript config
└── package.json

### Component File Structure

Each component follows this pattern:
```

ComponentName/
├── ComponentName.tsx # Main component
├── ComponentName.module.scss # Scoped styles (CSS Modules)
├── ComponentName.types.ts # TypeScript interfaces (optional)
├── index.ts # Clean export
└── parts/ # Private sub-components (optional)
└── SubComponent.tsx

````

### React Hooks We'll Use

```typescript
// Built-in Hooks
useState()      // Local component state
useEffect()     // Side effects (API calls, subscriptions)
useRef()        // DOM refs, mutable values without re-render
useCallback()   // Memoize functions (prevent recreating)
useMemo()       // Memoize expensive calculations
useContext()    // Access context values

// Custom Hooks (we'll build)
useAuth()       // Authentication state & actions
useApi()        // API calls with loading/error states
useForm()       // Form state management
````

### Build Modes

**Development (`pnpm dev`):**

- Vite dev server with HMR (Hot Module Replacement)
- Source maps for easy debugging
- No minification (readable code)
- API proxy to backend (avoid CORS)
- Fast rebuilds on file changes

**Production (`pnpm build`):**

- Minified JavaScript (smaller files)
- Tree-shaking (remove unused code)
- Code splitting (lazy load routes)
- Optimized images
- Static files in `dist/` folder
- Served by Nginx/CDN

## Data Flow

### Email/Password Authentication Flow

```
1. User submits login form (email, password)
   ↓
2. Frontend sends POST /auth/login
   ↓
3. Auth service validates credentials
   ↓
4. Auth service generates JWT tokens (access + refresh)
   ↓
5. Auth service sets HttpOnly cookies (NOT localStorage!)
   - accessToken (15 min expiry)
   - refreshToken (7 day expiry)
   ↓
6. Auth service returns user data (NO tokens in response body!)
   ↓
7. Frontend updates Zustand auth store with user
   ↓
8. User redirected to dashboard
```

### Google OAuth Authentication Flow

```
1. User clicks "Login with Google"
   ↓
2. Frontend redirects to: /auth/google
   ↓
3. Passport redirects to Google login page
   ↓
4. User authenticates with Google
   ↓
5. Google redirects to: /auth/google/callback?code=...
   ↓
6. Passport exchanges code for user profile
   ↓
7. Auth service creates/finds user in database
   ↓
8. Auth service generates JWT tokens
   ↓
9. Auth service sets HttpOnly cookies
   ↓
10. Auth service redirects to frontend dashboard
    ↓
11. Frontend loads with cookies (automatic!)
```

### Protected API Request Flow

```
1. Frontend makes API request
   - Browser AUTOMATICALLY sends cookies (credentials: 'include')
   ↓
2. Backend middleware extracts JWT from cookie
   ↓
3. Backend middleware validates JWT
   ↓
4. If valid: Process request, return data
   If expired: Return 401 Unauthorized
   ↓
5. If 401: Frontend calls /auth/refresh (refresh token in cookie)
   ↓
6. If refresh succeeds: Retry original request
   If refresh fails: Redirect to login
```

### Token Refresh Flow

```
1. Access token expires (after 15 min)
   ↓
2. API request returns 401 Unauthorized
   ↓
3. Frontend automatically calls POST /auth/refresh
   - Refresh token sent via HttpOnly cookie
   ↓
4. Backend validates refresh token
   ↓
5. Backend generates new access token
   ↓
6. Backend sets new access token cookie
   ↓
7. Frontend retries original request
```

### Security: Why HttpOnly Cookies (NOT localStorage)

```
❌ localStorage:
   - JavaScript CAN read it
   - XSS attack can steal tokens
   - Must manually send tokens

✅ HttpOnly Cookies:
   - JavaScript CANNOT read them (XSS protection!)
   - Browser sends automatically (no manual code)
   - SameSite=strict prevents CSRF
   - Secure flag ensures HTTPS only
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
