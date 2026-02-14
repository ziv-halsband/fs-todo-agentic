# Auth Service

Authentication microservice handling user identity, access control, and session management. Supports email/password signup/login and Google OAuth. Issues JWT tokens stored in HttpOnly cookies for XSS protection.

## Tech Stack

- **Node.js** + **TypeScript** + **Express**
- **Prisma** (PostgreSQL ORM)
- **JWT** (jsonwebtoken)
- **Passport** (Google OAuth 2.0)
- **bcrypt** (password hashing)
- **express-validator** (input validation)
- **cookie-parser** (HttpOnly cookie management)

## Project Structure

```
services/auth-service/
├── src/
│   ├── config/          # Database, Passport configuration
│   ├── controllers/     # HTTP request handlers
│   ├── middleware/      # Auth, validators, error handling
│   ├── repositories/    # Data access layer (Prisma queries)
│   ├── routes/          # API route definitions (authRoutes, oauthRoutes)
│   ├── services/        # Business logic
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Error classes, JWT helpers, password utils
│   └── index.ts         # Entry point
├── prisma/
│   ├── schema.prisma    # Database schema (User model)
│   └── migrations/      # Database migrations
├── package.json
└── tsconfig.json
```

## Running Locally

```bash
# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# Start dev server (port 3001)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# View database
pnpm prisma:studio
```

## Environment Variables

Required variables (see `.env` file):

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3001)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for signing tokens
- `JWT_EXPIRES_IN` - Access token lifetime (e.g., "15m")
- `REFRESH_TOKEN_EXPIRES_IN` - Refresh token lifetime (e.g., "7d")
- `BCRYPT_ROUNDS` - Bcrypt hashing rounds (e.g., 10)
- `CORS_ORIGIN` - Allowed CORS origin (frontend URL)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_CALLBACK_URL` - Google OAuth callback URL
- `FRONTEND_URL` - Frontend URL for OAuth redirects

## API Surface

### Authentication Routes (`/api/auth`)

- `POST /signup` - Create new user account
- `POST /login` - Login with email/password
- `GET /me` - Get current user (protected)
- `POST /refresh` - Refresh access token
- `POST /logout` - Logout (protected)

### OAuth Routes (`/api/oauth`)

- `GET /google` - Initiate Google OAuth flow
- `GET /google/callback` - Google OAuth callback
- `GET /error` - OAuth error handler

All endpoints return consistent JSON:

```json
{ "success": true, "data": {...} }
{ "success": false, "error": {...} }
```

Tokens stored in HttpOnly cookies (`accessToken`, `refreshToken`).

## Notes for AI Agents

### Business Logic

- **Location**: `src/services/authService.ts`
- **Pattern**: Controllers call services, services call repositories
- **Flow**: `controller → service → repository → Prisma`

### Input Validation

- **Location**: `src/middleware/validators.ts`
- **Framework**: `express-validator`
- **Validators**: `validateSignup`, `validateLogin`
- **Usage**: Validation chains run before controllers

### Authentication & Cookies

- **Location**: `src/middleware/auth.ts` (authenticate middleware)
- **Cookie config**: `src/controllers/authController.ts` (getCookieOptions)
- **Settings**: `httpOnly: true`, `secure: true` (production), `sameSite: 'strict'`
- **JWT helpers**: `src/utils/jwt.ts`

### Error Handling

- **Location**: `src/utils/errors.ts`
- **Classes**: `AppError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`
- **Handler**: `src/middleware/errorHandler.ts`
- **Pattern**: Throw custom errors anywhere, middleware catches and formats response

### Database

- **ORM**: Prisma
- **Schema**: `prisma/schema.prisma`
- **Model**: `User` (id, email, passwordHash, fullName, role, provider, etc.)
- **Repositories**: `src/repositories/userRepository.ts`

### Key Decisions

- HttpOnly cookies prevent XSS (tokens never exposed to JavaScript)
- Layered architecture (controller → service → repository)
- express-validator for input validation
- Consistent error classes with HTTP status codes
- Passport for OAuth (Google strategy configured)
