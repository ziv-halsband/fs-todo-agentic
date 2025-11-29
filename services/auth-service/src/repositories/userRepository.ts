import { PrismaClient, type User, type UserRole } from '@prisma/client';

import { ConflictError, NotFoundError } from '../utils/errors';

const prisma = new PrismaClient();

/**
 * Data Transfer Objects (DTOs)
 * These define the shape of data going in/out of repository
 */

export interface CreateUserData {
  email: string;
  passwordHash: string;
  fullName: string;
  avatarUrl?: string;
  role?: UserRole;
}

export interface UpdateUserData {
  fullName?: string;
  avatarUrl?: string;
  role?: UserRole;
  isVerified?: boolean;
}

/**
 * User returned from database (without sensitive data)
 *
 * Why exclude passwordHash?
 * - Never return password hash to business layer
 * - Prevents accidental exposure in API responses
 */
export type SafeUser = Omit<User, 'passwordHash'>;

/**
 * User Repository Class
 */
export class UserRepository {
  /**
   * Find user by email
   *
   * Used for: Login (need to check password)
   * Returns: Full user INCLUDING passwordHash (needed for comparison)
   *
   * @param email - User email
   * @returns User with passwordHash, or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find user by ID
   *
   * Used for: Get current user profile, authorization checks
   * Returns: Safe user WITHOUT passwordHash
   *
   * @param id - User ID
   * @returns User without passwordHash
   * @throws NotFoundError if user doesn't exist
   */
  async findById(id: string): Promise<SafeUser> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        // passwordHash: false (explicitly exclude)
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Create new user
   *
   * Used for: Signup
   *
   * @param data - User creation data
   * @returns Created user without passwordHash
   * @throws ConflictError if email already exists
   */
  async create(data: CreateUserData): Promise<SafeUser> {
    try {
      const user = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash: data.passwordHash,
          fullName: data.fullName,
          avatarUrl: data.avatarUrl,
          role: data.role || 'USER',
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
          role: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return user;
    } catch (error: unknown) {
      // Prisma error codes: https://www.prisma.io/docs/reference/api-reference/error-reference
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        // Unique constraint violation
        throw new ConflictError('User with this email already exists');
      }
      throw error;
    }
  }

  /**
   * Update user
   *
   * Used for: Profile updates, email verification, role changes
   *
   * @param id - User ID
   * @param data - Fields to update
   * @returns Updated user without passwordHash
   * @throws NotFoundError if user doesn't exist
   */
  async update(id: string, data: UpdateUserData): Promise<SafeUser> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
          role: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return user;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2025'
      ) {
        // Record not found
        throw new NotFoundError('User not found');
      }
      throw error;
    }
  }

  /**
   * Delete user
   *
   * Used for: Account deletion (GDPR compliance)
   *
   * @param id - User ID
   * @throws NotFoundError if user doesn't exist
   */
  async delete(id: string): Promise<void> {
    try {
      await prisma.user.delete({
        where: { id },
      });
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2025'
      ) {
        throw new NotFoundError('User not found');
      }
      throw error;
    }
  }

  /**
   * Check if email exists
   *
   * Used for: Validation before signup
   *
   * @param email - Email to check
   * @returns True if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { email },
    });
    return count > 0;
  }

  /**
   * Disconnect Prisma Client
   *
   * Used for: Graceful shutdown
   * Should be called when app closes
   */
  async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
