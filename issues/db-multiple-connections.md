# Issue: Multiple Prisma Client Instances (Connection Pool Leak)

**Status**: ✅ Resolved  
**Priority**: Medium  
**Affects**: auth-service (pattern ready for future services)
**Resolved**: 2026-02-14

---

## Problem

Each repository was creating its own `PrismaClient` instance, leading to multiple connection pools and potential connection leaks.

---

## Solution Implemented

**Singleton Pattern** applied in auth-service:

### Files Created:

1. **`src/config/database.ts`** - Singleton PrismaClient instance
   - Single shared instance per service
   - Hot-reload safe for development
   - Production-ready

2. **`src/types/global.d.ts`** - TypeScript global type definitions
   - Allows `global.prisma` in development

### Files Updated:

3. **`src/repositories/userRepository.ts`** - Uses shared instance
   - Changed from `const prisma = new PrismaClient()` to `import prisma from '../config/database'`

---

## Benefits Achieved

- ✅ Single connection pool per service
- ✅ No connection leaks
- ✅ Hot-reload safe (development)
- ✅ Better memory usage
- ✅ Pattern ready for todo-service and future services

---

## Next Steps

- [ ] Apply same pattern to todo-service when created
- [ ] Consider PgBouncer for high-traffic production (>1000 req/sec)

---
