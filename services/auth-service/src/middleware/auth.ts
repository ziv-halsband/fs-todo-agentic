/**
 * Authentication Middleware
 *
 * Protects routes that require authentication
 * Extracts and verifies JWT token
 * Attaches user info to request
 */

import {
  verifyToken,
  extractTokenFromHeader,
  UnauthorizedError,
} from '../utils';

import type { Request, Response, NextFunction } from 'express';

/**
 * Extended Request with user info
 *
 * After auth middleware runs, req.user is available
 */
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * Authenticate JWT token
 *
 * Flow:
 * 1. Extract token from Authorization header OR cookie
 * 2. Verify token (checks signature & expiration)
 * 3. Attach user info to request
 * 4. Continue to next middleware/controller
 *
 * Usage:
 * router.get('/me', authenticate, getMe);
 *                   ↑ Protects this route
 *
 * @throws UnauthorizedError if token is missing or invalid
 */
export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    // Try to get token from Authorization header first
    let token: string | undefined;

    if (req.headers.authorization) {
      token = extractTokenFromHeader(req.headers.authorization);
    }
    // Fallback: Get from HttpOnly cookie
    else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken as string;
    }

    if (!token) {
      ``;
      throw new UnauthorizedError('Authentication token is required');
    }

    // Verify and decode token
    const payload = verifyToken(token);

    // Attach user info to request
    (req as AuthRequest).user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication
 *
 * Similar to authenticate, but doesn't throw error if token missing
 * Useful for routes that work for both authenticated and anonymous users
 *
 * Usage:
 * router.get('/public', optionalAuth, handler);
 */
export const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    if (req.headers.authorization) {
      token = extractTokenFromHeader(req.headers.authorization);
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken as string;
    }

    // If no token, just continue (user stays undefined)
    if (!token) {
      next();
      return;
    }

    // If token exists, verify it
    const payload = verifyToken(token);

    (req as AuthRequest).user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    // Token exists but invalid - continue without auth
    // (Don't throw error for optional auth)
    next();
  }
};
