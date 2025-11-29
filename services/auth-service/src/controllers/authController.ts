/**
 * Auth Controller
 *
 * Handles HTTP layer:
 * - Parse requests
 * - Call service layer
 * - Set HttpOnly cookies (SECURITY!)
 * - Format responses
 *
 * Controllers are thin - business logic is in services!
 */

import { authService } from '../services';

import type { AuthRequest } from '../middleware/auth';
import type { Request, Response, NextFunction } from 'express';

/**
 * Cookie Configuration
 *
 * HttpOnly: JavaScript cannot access (XSS protection)
 * Secure: Only sent over HTTPS (in production)
 * SameSite: Prevents CSRF attacks
 *
 * These settings are CRITICAL for security!
 */
const getCookieOptions = (maxAge: number) => ({
  httpOnly: true, // ← Prevents XSS attacks!
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict' as const, // ← Prevents CSRF attacks!
  maxAge, // Time in milliseconds
});

/**
 * Signup Handler
 *
 * POST /auth/signup
 * Body: { email, password, fullName }
 *
 * Flow:
 * 1. Request validated by middleware
 * 2. Call authService.signup
 * 3. Set tokens in HttpOnly cookies
 * 4. Return user data (NO TOKENS in response!)
 */
export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, fullName } = req.body as {
      email: string;
      password: string;
      fullName: string;
    };

    const result = await authService.signup(email, password, fullName);

    // Set tokens in HttpOnly cookies
    // Access token: 15 minutes
    res.cookie(
      'accessToken',
      result.accessToken,
      getCookieOptions(15 * 60 * 1000)
    );

    // Refresh token: 7 days
    res.cookie(
      'refreshToken',
      result.refreshToken,
      getCookieOptions(7 * 24 * 60 * 60 * 1000)
    );

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body as {
      email: string;
      password: string;
    };

    const result = await authService.login(email, password);

    // Set tokens in HttpOnly cookies
    res.cookie(
      'accessToken',
      result.accessToken,
      getCookieOptions(15 * 60 * 1000)
    );

    res.cookie(
      'refreshToken',
      result.refreshToken,
      getCookieOptions(7 * 24 * 60 * 60 * 1000)
    );

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Current User Handler
 *
 * GET /auth/me
 * Protected route (requires authentication)
 *
 * Token comes from cookie automatically!
 * Middleware extracts userId from token
 */
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as AuthRequest;

    // userId comes from authenticate middleware
    if (!authReq.user?.userId) {
      throw new Error('User ID not found in request');
    }

    const user = await authService.getCurrentUser(authReq.user.userId);

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies?.refreshToken as string | undefined;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Refresh token not found',
          code: 401,
        },
      });
      return;
    }

    const result = await authService.refreshToken(refreshToken);

    // Set new access token in cookie
    res.cookie(
      'accessToken',
      result.accessToken,
      getCookieOptions(15 * 60 * 1000)
    );
    res.status(200).json({
      success: true,
      data: {
        message: 'Token refreshed successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout Handler
 *
 * POST /auth/logout
 *
 * Clears cookies on client side
 * Service layer returns success
 *
 * Security note:
 * - Token still valid until expiration (15 min)
 * - Acceptable for short-lived tokens
 * - With Redis, we'd blacklist the token
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as AuthRequest;

    if (!authReq.user?.userId) {
      throw new Error('User ID not found in request');
    }

    await authService.logout(authReq.user.userId);

    // Clear cookies
    res.clearCookie('accessToken', getCookieOptions(0));
    res.clearCookie('refreshToken', getCookieOptions(0));

    res.status(200).json({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};
