import type { PrismaClient } from '@fs-project/db';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export {};
