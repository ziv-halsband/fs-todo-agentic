import { generateAccessToken } from '@fs-project/backend-common';
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

export interface AuthenticatedUser {
  userId: string;
  email: string;
  authHeader: string;
}

/**
 * Create a real User row in the DB and return a valid JWT for that user.
 *
 * todo-service has no signup endpoint, so we bypass HTTP entirely:
 * create the user via Prisma, then call generateAccessToken directly.
 * Tests use .set('Authorization', authHeader) — no cookie handling needed.
 */
export async function createAuthenticatedUser(overrides?: {
  email?: string;
  fullName?: string;
}): Promise<AuthenticatedUser> {
  const email = overrides?.email ?? 'test@example.com';
  const fullName = overrides?.fullName ?? 'Test User';

  const user = await prisma.user.create({
    data: {
      email,
      fullName,
      passwordHash: 'not-a-real-hash',
    },
  });

  const token = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    userId: user.id,
    email: user.email,
    authHeader: `Bearer ${token}`,
  };
}
