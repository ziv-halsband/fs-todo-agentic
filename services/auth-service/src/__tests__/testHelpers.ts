import { prisma } from '@fs-project/db';

/**
 * Wipe all tables between tests.
 *
 * Delete order matters — FK constraints must be satisfied:
 *   Todo  → depends on List + User
 *   List  → depends on User
 *   User  → root (onDelete: Cascade handles children, but we're explicit here)
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

export async function cleanDatabase(): Promise<void> {
  await prisma.todo.deleteMany();
  await prisma.list.deleteMany();
  await prisma.user.deleteMany();
}
