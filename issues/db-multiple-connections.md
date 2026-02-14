# Issue: Multiple Prisma Client Instances (Connection Pool Leak)

**Status**: 🔴 Open  
**Priority**: Medium  
**Affects**: auth-service (and future services)

---

## Problem

Each repository creates its own `PrismaClient` instance:

```typescript
// services/auth-service/src/repositories/userRepository.ts:10
const prisma = new PrismaClient();
```

**Impact:**

- Each PrismaClient = separate connection pool
- Multiple imports = multiple connections to Postgres
- Connection limit exhaustion (Postgres default: ~100 connections)
- Memory waste and slower performance
- Will compound when we add todo-service and future services

---

## Current Behavior

```typescript
// Multiple PrismaClient instances created
import { userRepository } from './repositories'; // Creates PrismaClient #1
// If we had more repositories:
import { postRepository } from './repositories'; // Creates PrismaClient #2
import { sessionRepository } from './repositories'; // Creates PrismaClient #3
```

Each repository holds open connections even when not in use.

---

## Proposed Solution

**Singleton Pattern**: Single shared PrismaClient instance per service.

### Implementation

1. Create `src/config/database.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // Prevent hot-reload from creating new instances in dev
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export default prisma;
```

2. Update all repositories to import shared instance:

```typescript
// Before
const prisma = new PrismaClient();

// After
import prisma from '../config/database';
```

3. Add TypeScript global type definition:

```typescript
// src/types/global.d.ts
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}
```

---

## Files to Update

- [ ] Create `services/auth-service/src/config/database.ts`
- [ ] Update `services/auth-service/src/repositories/userRepository.ts`
- [ ] Create `services/auth-service/src/types/global.d.ts`
- [ ] Apply same pattern to todo-service (when created)

---

## Benefits

- ✅ Single connection pool per service
- ✅ No connection leaks
- ✅ Hot-reload safe (development)
- ✅ Better memory usage
- ✅ Scales to multiple services

---

## Related

- For high-traffic production (>1000 req/sec): Consider PgBouncer connection pooler
- For K8s deployments: Configure connection limits in DATABASE_URL
- See: https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
