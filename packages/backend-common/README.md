# Backend Common Package

Shared backend utilities used across all microservices (auth-service, todo-service, etc.).

## Contents

- **Error Classes**: Custom error types with HTTP status codes
- **JWT Utilities**: Token generation and verification
- **Middleware**: Authentication middleware (authenticate, optionalAuth)

## Usage

### In a Service

```typescript
// services/auth-service/package.json
{
  "dependencies": {
    "@fs-project/backend-common": "workspace:*"
  }
}
```

```typescript
// services/auth-service/src/controllers/authController.ts
import { ValidationError, UnauthorizedError } from '@fs-project/backend-common';
import { authenticate } from '@fs-project/backend-common';

// Use in routes
router.get('/me', authenticate, authController.getMe);

// Throw in services
throw new ValidationError('Email is required');
```

## Development

```bash
# Build package
cd packages/backend-common
pnpm build

# Watch mode (for development)
pnpm dev

# Clean
pnpm clean
```

## What's Included

### Error Classes

- `AppError` - Base error class
- `ValidationError` (400)
- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `NotFoundError` (404)
- `ConflictError` (409)

### JWT Functions

- `generateAccessToken(payload)` - Create access token (15m)
- `generateRefreshToken(payload)` - Create refresh token (7d)
- `verifyToken(token)` - Verify and decode token

### Middleware

- `authenticate` - Require JWT authentication
- `optionalAuth` - Optional authentication
- `AuthRequest` - TypeScript type for authenticated requests

## Environment Variables Required

Services using this package need:

- `JWT_SECRET` - Secret key for signing tokens
- `JWT_EXPIRES_IN` - Access token lifetime (default: "15m")
- `REFRESH_TOKEN_EXPIRES_IN` - Refresh token lifetime (default: "7d")
