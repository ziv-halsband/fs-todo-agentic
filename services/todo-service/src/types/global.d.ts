/**
 * Global Type Definitions
 *
 * Extends the global namespace for development hot-reload support
 */

import type { PrismaClient } from '../generated/prisma';

declare global {
  // Allow global.prisma in development to prevent multiple instances
  // Using 'var' to ensure it's in the global scope
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export {};
