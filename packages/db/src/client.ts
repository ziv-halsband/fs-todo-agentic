import { PrismaClient } from './generated/prisma';

// Standard singleton pattern — safe for hot-reload in development.
// globalThis persists across module re-evaluations; production is
// unaffected because hot-reload doesn't happen there.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
