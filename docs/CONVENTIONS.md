# Coding Conventions & Best Practices

## General Principles

### SOLID Principles

- **Single Responsibility**: Each module/class has one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Subtypes must be substitutable for base types
- **Interface Segregation**: Many specific interfaces over one general
- **Dependency Inversion**: Depend on abstractions, not concretions

### DRY (Don't Repeat Yourself)

- Extract common logic to shared packages
- Create reusable utilities and helpers
- Use composition over duplication

### KISS (Keep It Simple, Stupid)

- Prefer simple solutions over complex ones
- Write clear, readable code
- Avoid premature optimization

## TypeScript

### File Naming

```
PascalCase     → Components, Classes:     UserProfile.tsx, AuthService.ts
camelCase      → Files, Functions:        userUtils.ts, formatDate.ts
kebab-case     → Folders, Config:         auth-service/, docker-compose.yml
UPPER_CASE     → Constants, Env:          MAX_RETRIES, DATABASE_URL
```

### Type Definitions

```typescript
// ✅ Good: Explicit types
interface User {
  id: string;
  email: string;
  fullName: string;
}

function getUser(id: string): Promise<User> {
  // ...
}

// ❌ Bad: Implicit any
function getUser(id) {
  // ...
}

// ✅ Good: Type guards
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' && obj !== null && 'id' in obj && 'email' in obj
  );
}

// ✅ Good: Generic types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ✅ Good: Union types
type UserRole = 'admin' | 'editor' | 'viewer';

// ❌ Bad: String literal without type
const role = 'admin'; // type: string (too broad)

// ✅ Good: Const assertion
const role = 'admin' as const; // type: 'admin'
```

### Enums vs Unions

```typescript
// ✅ Prefer: String literal unions (tree-shakeable)
export type HttpStatus = 'ok' | 'error' | 'pending';

// ⚠️ Use sparingly: Enums (not tree-shakeable, generates runtime code)
export enum HttpStatus {
  OK = 'ok',
  ERROR = 'error',
  PENDING = 'pending',
}

// ✅ Good: Const object for grouped constants
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
} as const;

export type HttpStatusCode = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];
```

### Null Safety

```typescript
// ✅ Good: Optional chaining
const userName = user?.profile?.name;

// ✅ Good: Nullish coalescing
const displayName = user?.name ?? 'Anonymous';

// ✅ Good: Type narrowing
if (user) {
  console.log(user.name); // TypeScript knows user is not null
}

// ❌ Bad: Non-null assertion (use only when absolutely sure)
const name = user!.name;
```

## Backend (Node.js/Express)

### Project Structure

```
services/auth-service/
├── src/
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   ├── repositories/     # Data access layer
│   ├── middleware/       # Express middleware
│   ├── routes/           # API routes
│   ├── validators/       # Input validation
│   ├── types/            # TypeScript types
│   ├── utils/            # Helper functions
│   ├── config/           # Configuration
│   └── index.ts          # Entry point
├── prisma/
│   └── schema.prisma
├── tests/
├── .env.example
├── package.json
└── tsconfig.json
```

### Layered Architecture

```typescript
// ✅ Good: Separation of concerns

// Controller layer (handles HTTP)
export class AuthController {
  constructor(private authService: AuthService) {}

  async signup(req: Request, res: Response) {
    const { email, password } = req.body;
    const user = await this.authService.signup(email, password);
    res.status(201).json({ success: true, data: user });
  }
}

// Service layer (business logic)
export class AuthService {
  constructor(private userRepository: UserRepository) {}

  async signup(email: string, password: string): Promise<User> {
    const hashedPassword = await hashPassword(password);
    return this.userRepository.create(email, hashedPassword);
  }
}

// Repository layer (data access)
export class UserRepository {
  constructor(private db: PrismaClient) {}

  async create(email: string, passwordHash: string): Promise<User> {
    return this.db.user.create({
      data: { email, passwordHash },
    });
  }
}
```

### Error Handling

```typescript
// ✅ Good: Custom error classes
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

// ✅ Good: Centralized error handler middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.statusCode,
      },
    });
  }

  // Log unexpected errors
  logger.error('Unexpected error:', err);

  res.status(500).json({
    success: false,
    error: { message: 'Internal server error' },
  });
};

// ✅ Good: Try-catch in async handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

### API Response Format

```typescript
// ✅ Good: Consistent response structure
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// Success response
res.json({
  success: true,
  data: { user: { id: '123', email: 'test@example.com' } }
});

// Error response
res.status(400).json({
  success: false,
  error: {
    message: 'Invalid email format',
    code: 'VALIDATION_ERROR'
  }
});

// Paginated response
res.json({
  success: true,
  data: { todos: [...] },
  meta: { page: 1, limit: 10, total: 100 }
});
```

### Environment Variables

```typescript
// ✅ Good: Validate env vars at startup
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.string().transform(Number),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
});

export const env = envSchema.parse(process.env);

// Usage
const port = env.PORT; // type: number
```

### Database (Prisma)

#### Schema Conventions

```prisma
// ✅ Good: Clear naming, proper types
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String   @map("password_hash")
  fullName     String   @map("full_name")
  role         UserRole @default(USER)
  isVerified   Boolean  @default(false) @map("is_verified")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  todos Todo[]

  @@map("users")
  @@index([email])
}

enum UserRole {
  USER
  ADMIN
  EDITOR
}
```

#### Query Patterns

```typescript
// ✅ Good: Select only needed fields
const user = await prisma.user.findUnique({
  where: { id },
  select: { id: true, email: true, fullName: true },
});

// ✅ Good: Use transactions for multiple operations
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  await tx.session.create({ data: { userId: user.id } });
});

// ✅ Good: Pagination
const users = await prisma.user.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' },
});

// ❌ Bad: N+1 queries
for (const user of users) {
  const todos = await prisma.todo.findMany({ where: { userId: user.id } });
}

// ✅ Good: Use include/select
const users = await prisma.user.findMany({
  include: { todos: true },
});
```

## Frontend (React)

### Component Structure

```typescript
// ✅ Good: Functional component with TypeScript
interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
  className?: string;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  className,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
    onEdit?.(user);
  };

  return (
    <Card className={className}>
      <Typography variant="h6">{user.fullName}</Typography>
      <Button onClick={handleEdit}>Edit</Button>
    </Card>
  );
};

// ❌ Bad: Default export (harder to refactor)
export default function UserCard(props) { }
```

### Custom Hooks

```typescript
// ✅ Good: Extract logic to hooks
export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const isAuthenticated = !!user;

  return { user, login, logout, isAuthenticated };
}

// Usage
const { isAuthenticated, logout } = useAuth();
```

### State Management (Zustand)

```typescript
// ✅ Good: Typed Zustand store
interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    set({ user: response.data.user, token: response.data.token });
  },

  logout: () => {
    set({ user: null, token: null });
    localStorage.removeItem('token');
  },

  setUser: (user) => set({ user }),
}));
```

### Styling (SCSS Modules)

```scss
// ✅ Good: Component-scoped styles
// UserCard.module.scss
.container {
  padding: var(--spacing-md);
  border-radius: var(--radius-md);

  .header {
    display: flex;
    justify-content: space-between;
  }

  .title {
    font-size: var(--font-size-lg);
    color: var(--color-text-primary);
  }
}

// Usage in component
import styles from './UserCard.module.scss';

<div className={styles.container}>
  <div className={styles.header}>
    <h2 className={styles.title}>{user.name}</h2>
  </div>
</div>
```

### API Calls

```typescript
// ✅ Good: Centralized API service
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

// Request interceptor (add auth token)
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor (handle errors)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  signup: (data: SignupData) => api.post('/auth/signup', data),

  getMe: () => api.get('/auth/me'),
};
```

## Git & Version Control

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks
- `style`: Code style changes (formatting)
- `perf`: Performance improvements

**Examples:**

```
feat(auth): add password reset endpoint

Implement password reset flow with email verification.
- Add reset token generation
- Send email with reset link
- Validate token and update password

Closes #123

---

fix(frontend): resolve login redirect loop

Users were stuck in redirect loop after login when accessing
protected routes. Added proper state management.

Fixes #456

---

docs(readme): update installation instructions

Add section about environment variable configuration.
```

### Branch Naming

```
feature/JIRA-123-add-google-oauth
fix/JIRA-456-login-validation
refactor/cleanup-auth-service
docs/update-api-documentation
```

## Testing

### Unit Tests

```typescript
// ✅ Good: Descriptive test names
describe('AuthService', () => {
  describe('signup', () => {
    it('should create user with hashed password', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      const user = await authService.signup(email, password);

      expect(user.email).toBe(email);
      expect(user.passwordHash).not.toBe(password);
    });

    it('should throw error when email already exists', async () => {
      await authService.signup('test@example.com', 'pass123');

      await expect(
        authService.signup('test@example.com', 'pass456')
      ).rejects.toThrow('Email already exists');
    });
  });
});
```

### Test Coverage

- Aim for >80% coverage
- Focus on business logic
- Test edge cases and error paths
- Mock external dependencies

## Documentation

### Code Comments

```typescript
// ✅ Good: Explain WHY, not WHAT
// We use bcrypt with 10 rounds because it provides good security
// while maintaining acceptable performance (<100ms on modern hardware)
const hashedPassword = await bcrypt.hash(password, 10);

// ❌ Bad: State the obvious
// Hash the password
const hashedPassword = await bcrypt.hash(password, 10);

// ✅ Good: Document complex logic
/**
 * Refreshes JWT token if it's within 5 minutes of expiration.
 * This prevents race conditions where the token expires during
 * a multi-step operation.
 */
function shouldRefreshToken(token: string): boolean {
  const decoded = jwt.decode(token);
  const expiresIn = decoded.exp - Date.now() / 1000;
  return expiresIn < 300; // 5 minutes
}
```

### JSDoc

```typescript
/**
 * Authenticates user and generates JWT tokens
 * @param email - User's email address
 * @param password - Plain text password
 * @returns Access token, refresh token, and user data
 * @throws {UnauthorizedError} When credentials are invalid
 * @throws {ValidationError} When input validation fails
 * @example
 * const result = await login('user@example.com', 'password123');
 * console.log(result.accessToken);
 */
export async function login(
  email: string,
  password: string
): Promise<LoginResult> {
  // ...
}
```

## Performance

### Backend

- Use database indexes
- Implement caching (Redis)
- Use connection pooling
- Paginate large result sets
- Use async/await properly
- Avoid N+1 queries

### Frontend

- Code splitting
- Lazy loading
- Memoization (`useMemo`, `useCallback`)
- Virtual scrolling for large lists
- Optimize images
- Minimize bundle size

## Security

### Never Commit

- API keys, secrets
- `.env` files
- Private keys
- Passwords
- Database credentials

### Always

- Validate user input
- Sanitize data
- Use parameterized queries
- Implement rate limiting
- Keep dependencies updated
- Use HTTPS in production
- Set secure HTTP headers
