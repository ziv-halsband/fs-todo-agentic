import { userRepository, type SafeUser } from '../repositories';
import {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  type JWTPayload,
  UnauthorizedError,
  ValidationError,
} from '../utils';

/**
 * Auth Service Response Types
 */

export interface SignupResponse {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}

/**
 * Auth Service Class
 */
export class AuthService {
  /**
   * User Signup
   *
   * Flow:
   * 1. Validate password strength
   * 2. Check if email already exists
   * 3. Hash password
   * 4. Create user in database
   * 5. Generate tokens
   * 6. Return user + tokens
   *
   * @param email - User email
   * @param password - Plain text password
   * @param fullName - User's full name
   * @returns User data with tokens
   * @throws ValidationError if password is weak or email exists
   */
  async signup(
    email: string,
    password: string,
    fullName: string
  ): Promise<SignupResponse> {
    // 1. Validate password strength
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      throw new ValidationError(passwordError);
    }

    // 2. Check if email already exists
    const emailExists = await userRepository.emailExists(email);
    if (emailExists) {
      throw new ValidationError('User with this email already exists');
    }

    // 3. Hash password
    const passwordHash = await hashPassword(password);

    // 4. Create user in database
    const user = await userRepository.create({
      email,
      passwordHash,
      fullName,
    });

    // 5. Generate tokens
    const tokenPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // 6. Return user + tokens
    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  /**
   * User Login
   *
   * Flow:
   * 1. Find user by email
   * 2. Check if user exists
   * 3. Compare passwords
   * 4. Generate tokens
   * 5. Return user + tokens
   *
   * @param email - User email
   * @param password - Plain text password
   * @returns User data with tokens
   * @throws UnauthorizedError if credentials are invalid
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    // 1. Find user by email (with passwordHash for comparison)
    const user = await userRepository.findByEmail(email);

    // 2. Check if user exists
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // 3. Compare passwords
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // 4. Generate tokens
    const tokenPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // 5. Remove passwordHash from response
    const { passwordHash: _passwordHash, ...safeUser } = user;

    // 6. Return user + tokens
    return {
      user: safeUser,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Get Current User
   *
   * Used for: /me endpoint (get authenticated user profile)
   *
   * @param userId - User ID from JWT token
   * @returns User profile
   * @throws NotFoundError if user doesn't exist
   */
  async getCurrentUser(userId: string): Promise<SafeUser> {
    return userRepository.findById(userId);
  }

  /**
   * Refresh Access Token
   *
   * Flow:
   * 1. Verify refresh token
   * 2. Check if user still exists
   * 3. Generate new access token
   * 4. Return new tokens
   *
   * @param refreshToken - JWT refresh token
   * @returns New access and refresh tokens
   * @throws UnauthorizedError if token is invalid
   */
  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    // 1. Verify refresh token
    const payload = verifyToken(refreshToken);

    // 2. Check if user still exists
    const user = await userRepository.findById(payload.userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // 3. Generate new tokens
    const tokenPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout
   *
   * Current implementation (Stateless JWT):
   * - Server clears cookies (controller layer does this)
   * - Token remains valid until expiration (15 min - acceptable)
   * - Client-side logout is immediate (cookies deleted)
   *
   * Why this is acceptable:
   * - Short token lifetime (15 min) limits damage
   * - HttpOnly cookies prevent XSS theft
   * - HTTPS prevents network sniffing
   *
   * Future with Redis:
   * - Add session tracking with sessionId in JWT
   * - Delete session from Redis on logout (instant revocation)
   * - Check session exists on each request
   *
   * @param userId - User ID from JWT (for future session cleanup)
   * @returns Success message
   */
  async logout(_userId: string): Promise<{ message: string }> {
    // Service layer just returns success
    // Controller layer handles cookie clearing

    // TODO: When we add Redis:
    // const sessionId = extractSessionIdFromContext();
    // await redis.del(`session:${sessionId}`);

    return Promise.resolve({
      message: 'Logged out successfully',
    });
  }
}

// Export singleton instance
export const authService = new AuthService();
