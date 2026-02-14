# Common Package

Shared types, enums, and constants used across **both** frontend and backend.

## Contents

- **UserRole** enum
- **AuthProvider** enum
- Future: API types, constants, utility functions

## Usage

### In Backend Service

```typescript
// services/auth-service/package.json
{
  "dependencies": {
    "@fs-project/common": "workspace:*"
  }
}
```

```typescript
// services/auth-service/src/types.ts
import { UserRole, AuthProvider } from '@fs-project/common';

interface User {
  id: string;
  email: string;
  role: UserRole; // ← Shared enum
  provider: AuthProvider;
}
```

### In Frontend

```typescript
// frontend/package.json
{
  "dependencies": {
    "@fs-project/common": "workspace:*"
  }
}
```

```typescript
// frontend/src/types.ts
import { UserRole } from '@fs-project/common';

// Frontend and backend use same types!
```

## Development

```bash
# Build package
cd packages/common
pnpm build

# Watch mode
pnpm dev

# Clean
pnpm clean
```

## What's Included

### Enums

- `UserRole` - USER, EDITOR, ADMIN
- `AuthProvider` - EMAIL, GOOGLE

### Future Additions

- API request/response types
- HTTP status code constants
- Validation schemas (Zod)
- Common utility functions
