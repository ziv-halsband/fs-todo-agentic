/**
 * Authentication Middleware
 *
 * Shared across all backend services for consistent JWT authentication.
 */

import { UnauthorizedError } from './errors';
import { verifyToken } from './jwt';

import type { Request, Response, NextFunction } from 'express';

/**
 * Extended Request with user info
 */
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * Extract token from Authorization header
 * Supports: "Bearer <token>"
 */
function extractTokenFromHeader(authHeader: string): string | undefined {
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }
  return undefined;
}

/**
 * Authenticate JWT token
 *
 * Extracts token from Authorization header or HttpOnly cookie,
 * verifies it, and attaches user info to request.
 *
 * @throws UnauthorizedError if token is missing or invalid
 */
export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    // Try Authorization header first
    if (req.headers.authorization) {
      token = extractTokenFromHeader(req.headers.authorization);
    }
    // Fallback to HttpOnly cookie
    else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken as string;
    }

    if (!token) {
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
 * Similar to authenticate, but doesn't throw error if token is missing.
 * Useful for routes that work for both authenticated and anonymous users.
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

    // No token? Continue without auth
    if (!token) {
      next();
      return;
    }

    // Verify token if present
    const payload = verifyToken(token);

    (req as AuthRequest).user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    // Token invalid - continue without auth (don't throw for optional)
    next();
  }
};
