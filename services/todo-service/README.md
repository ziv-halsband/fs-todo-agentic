# Todo Service

Microservice for managing user todos with full CRUD operations.

---

## Purpose

The Todo Service provides todo management functionality including creation, reading, updating, and deletion of todos. Each todo is owned by a user and access is controlled via JWT authentication.

---

## Tech Stack

**Language & Runtime:**

- Node.js 18+
- TypeScript (strict mode)

**Framework & Libraries:**

- Express.js - Web framework
- Prisma - ORM for PostgreSQL
- JWT - Token verification (via `@fs-project/backend-common`)

**Database:**

- PostgreSQL 16 (separate database: `todo_db`)

**Shared Packages:**

- `@fs-project/backend-common` - Errors, JWT, auth middleware
- `@fs-project/common` - Shared types/enums

---

## Project Structure

```
services/todo-service/
├── src/
│   ├── config/
│   │   └── database.ts          # Prisma singleton
│   ├── controllers/
│   │   ├── todoController.ts    # HTTP request handlers
│   │   └── index.ts
│   ├── services/
│   │   ├── todoService.ts       # Business logic
│   │   └── index.ts
│   ├── repositories/
│   │   ├── todoRepository.ts    # Database access
│   │   └── index.ts
│   ├── routes/
│   │   ├── todoRoutes.ts        # API endpoints
│   │   └── index.ts
│   ├── middleware/
│   │   ├── errorHandler.ts      # Global error handler
│   │   └── index.ts
│   ├── types/
│   │   └── global.d.ts          # TypeScript globals
│   └── index.ts                 # Express app entry
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── migrations/              # Database migrations
├── Dockerfile
├── package.json
├── tsconfig.json
└── .env
```

---

## Local Development

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL (via Docker Compose)

### Setup

1. **Start PostgreSQL:**

```bash
# From project root
docker-compose up -d postgres
```

2. **Install dependencies:**

```bash
# From project root
pnpm install
```

3. **Set up environment variables:**

```bash
cd services/todo-service
cp .env.example .env
# Edit .env with your settings (JWT_SECRET must match auth-service!)
```

4. **Run database migrations:**

```bash
pnpm prisma:migrate dev
```

5. **Start the service:**

```bash
pnpm dev
```

Service runs on **http://localhost:3002**

---

## Environment Variables

| Variable       | Description                          | Example                                                 |
| -------------- | ------------------------------------ | ------------------------------------------------------- |
| `NODE_ENV`     | Environment                          | `development`                                           |
| `PORT`         | Server port                          | `3002`                                                  |
| `DATABASE_URL` | PostgreSQL connection                | `postgresql://postgres:postgres@localhost:5432/todo_db` |
| `JWT_SECRET`   | JWT secret (MUST match auth-service) | `your-secret-key`                                       |
| `CORS_ORIGIN`  | Allowed CORS origin                  | `http://localhost:5173`                                 |

---

## API Endpoints

All endpoints require authentication via JWT token (from auth-service).

### Todos

| Method | Endpoint           | Description           | Auth     |
| ------ | ------------------ | --------------------- | -------- |
| GET    | `/api/todos`       | List all user's todos | Required |
| GET    | `/api/todos/stats` | Get todo statistics   | Required |
| GET    | `/api/todos/:id`   | Get single todo       | Required |
| POST   | `/api/todos`       | Create new todo       | Required |
| PATCH  | `/api/todos/:id`   | Update todo           | Required |
| DELETE | `/api/todos/:id`   | Delete todo           | Required |

### Health Check

| Method | Endpoint  | Description    | Auth |
| ------ | --------- | -------------- | ---- |
| GET    | `/health` | Service health | None |

---

## API Examples

### Create Todo

```bash
POST /api/todos
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread"
}
```

### List Todos

```bash
GET /api/todos
Authorization: Bearer <jwt-token>
```

### Update Todo

```bash
PATCH /api/todos/:id
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "completed": true
}
```

---

## Database Schema

```prisma
model Todo {
  id          String   @id @default(uuid())
  title       String
  description String?
  completed   Boolean  @default(false)
  userId      String   // Links to User in auth-service
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Notes:**

- `userId` links to User in `auth_db` (no foreign key, different database)
- Ownership verified at application level

---

## Notes for AI Agents

### Where to Find Things

**Business Logic:**

- `src/services/todoService.ts` - Core todo operations, validation

**Database Access:**

- `src/repositories/todoRepository.ts` - All Prisma queries
- `src/config/database.ts` - Prisma Client singleton

**HTTP Handling:**

- `src/controllers/todoController.ts` - Request/response handling
- `src/routes/todoRoutes.ts` - Route definitions

**Error Handling:**

- `src/middleware/errorHandler.ts` - Global error handler
- Uses `AppError` from `@fs-project/backend-common`

**Authentication:**

- Uses `authenticate` middleware from `@fs-project/backend-common`
- Extracts `userId` from JWT token
- No local auth logic (delegated to auth-service)

### Key Architectural Decisions

1. **Layered Architecture:**
   - Route → Controller → Service → Repository → Database
   - Clear separation of concerns

2. **Authentication:**
   - Stateless JWT verification only
   - Token generated by auth-service
   - Shared JWT_SECRET for verification

3. **Database:**
   - Separate `todo_db` database
   - No foreign keys to auth-service (different DB)
   - Ownership verified via userId in application code

4. **Shared Code:**
   - Error classes from `@fs-project/backend-common`
   - Auth middleware from `@fs-project/backend-common`
   - Keeps todo-service focused on todo logic

5. **Prisma Singleton:**
   - Single PrismaClient instance per process
   - Prevents connection pool leaks
   - Hot-reload safe in development

---

## Common Tasks

### Add a new field to Todo:

1. Update `prisma/schema.prisma`
2. Run `pnpm prisma:migrate dev --name add_field_name`
3. Update types in service/repository as needed

### Add a new endpoint:

1. Add method to `todoService.ts` (business logic)
2. Add method to `todoRepository.ts` if DB access needed
3. Add handler to `todoController.ts`
4. Add route to `todoRoutes.ts`

### Debug database queries:

```bash
# View Prisma queries
pnpm prisma:studio

# Or enable query logging in src/config/database.ts:
log: ['query', 'error', 'warn']
```

---

## Related Services

- **auth-service** (port 3001) - Authentication & user management
- **frontend** (port 5173) - React UI

---

## Scripts

| Command                | Description                              |
| ---------------------- | ---------------------------------------- |
| `pnpm dev`             | Start development server with hot-reload |
| `pnpm build`           | Compile TypeScript to dist/              |
| `pnpm start`           | Run compiled production code             |
| `pnpm prisma:generate` | Generate Prisma Client                   |
| `pnpm prisma:migrate`  | Run database migrations                  |
| `pnpm prisma:studio`   | Open Prisma Studio GUI                   |
| `pnpm test`            | Run tests                                |
