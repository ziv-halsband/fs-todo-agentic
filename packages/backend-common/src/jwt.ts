/**
 * JWT Token Utilities
 *
 * Shared JWT generation and verification for all backend services.
 */

import jwt from 'jsonwebtoken';

import { UnauthorizedError } from './errors';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Generate JWT access token (short-lived)
 */
export function generateAccessToken(payload: JWTPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  // @ts-expect-error - jsonwebtoken types have strict checking for expiresIn
  return jwt.sign(payload, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '15m'),
    issuer: 'auth-service',
    audience: 'todo-app',
  });
}

/**
 * Generate JWT refresh token (long-lived)
 */
export function generateRefreshToken(payload: JWTPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  // @ts-expect-error - jsonwebtoken types have strict checking for expiresIn
  return jwt.sign(payload, secret, {
    expiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'),
    issuer: 'auth-service',
    audience: 'todo-app',
  });
}

/**
 * Verify and decode JWT token
 *
 * @throws UnauthorizedError if token is invalid or expired
 */
export function verifyToken(token: string): JWTPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  try {
    const decoded = jwt.verify(token, secret, {
      issuer: 'auth-service',
      audience: 'todo-app',
    });

    return decoded as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid token');
    }
    throw new UnauthorizedError('Token verification failed');
  }
}
