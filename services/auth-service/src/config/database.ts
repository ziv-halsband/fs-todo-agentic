// Prisma client is now managed centrally in @fs-project/db.
// All services import the same singleton — one schema, one migration source.
export { prisma as default } from '@fs-project/db';
