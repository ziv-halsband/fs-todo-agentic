/**
 * Prisma Client Singleton
 *
 * Simple singleton pattern that works reliably with tsx hot-reload.
 * In production, module caching ensures single instance.
 */

import { PrismaClient } from '../generated/prisma';

// Create a single instance at module level
// Node.js module caching ensures this only runs once per process
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export default prisma;
