/**
 * Password Hashing Utilities using bcrypt
 *
 * Why bcrypt?
 * - Designed for passwords (slow by design = harder to crack)
 * - Automatic salt generation
 * - Industry standard
 * - Resistant to rainbow table attacks
 *
 * Alternative: argon2 (newer, more secure, but bcrypt is proven)
 */

import bcrypt from 'bcrypt';

/**
 * Hash a plain text password
 *
 * How it works:
 * 1. Generates a random salt
 * 2. Combines salt + password
 * 3. Hashes multiple times (rounds)
 *
 * @param password - Plain text password
 * @returns Hashed password (includes salt)
 *
 * @example
 * const hash = await hashPassword('myPassword123');
 * // Returns: "$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa"
 * //           ↑    ↑  ↑                    ↑
 * //         algo rounds  salt            hash
 */
export async function hashPassword(password: string): Promise<string> {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);

  // rounds = 10 means 2^10 = 1024 iterations
  // Higher = more secure but slower
  // 10 is good balance (< 100ms on modern hardware)

  return bcrypt.hash(password, rounds);
}

/**
 * Compare plain password with hashed password
 *
 * How it works:
 * 1. Extracts salt from hashed password
 * 2. Hashes plain password with same salt
 * 3. Compares results
 *
 * @param password - Plain text password
 * @param hashedPassword - Hashed password from database
 * @returns True if passwords match
 *
 * @example
 * const isValid = await comparePassword('myPassword123', user.passwordHash);
 * if (!isValid) throw new UnauthorizedError('Invalid credentials');
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Validate password strength
 *
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 *
 * @param password - Password to validate
 * @returns Error message if invalid, null if valid
 */
export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }

  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }

  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }

  if (!/\d/.test(password)) {
    return 'Password must contain at least one number';
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Password must contain at least one special character';
  }

  return null;
}
