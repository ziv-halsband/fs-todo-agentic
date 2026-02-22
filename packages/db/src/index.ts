// Re-export the singleton Prisma client
export { prisma } from './client';

// Re-export PrismaClient class (needed for global.d.ts type declarations)
export { PrismaClient } from './generated/prisma';

// Re-export all generated types: User, List, Todo, enums, etc.
// Any type change in schema.prisma will cause a compile error here
// and propagate to every service that imports from @fs-project/db.
export * from './generated/prisma';
