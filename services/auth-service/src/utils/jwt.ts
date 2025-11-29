import jwt from 'jsonwebtoken';

import { UnauthorizedError } from './errors';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateAccessToken(payload: JWTPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  // @ts-expect-error - jsonwebtoken types have strict checking for expiresIn
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    issuer: 'auth-service',
    audience: 'todo-app',
  });
}

/**
 * Generate JWT refresh token
 *
 * Refresh token = Long-lived (7 days)
 * Used for: Getting new access tokens
 *
 * @param payload - User data to encode
 * @returns Signed JWT token
 */
export function generateRefreshToken(payload: JWTPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  // @ts-expect-error - jsonwebtoken types have strict checking for expiresIn
  return jwt.sign(payload, secret, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    issuer: 'auth-service',
    audience: 'todo-app',
  });
}

/**
 * Verify and decode JWT token
 *
 * What it checks:
 * - Signature is valid (token wasn't tampered)
 * - Token isn't expired
 * - Token was issued by us
 *
 * @param token - JWT token to verify
 * @returns Decoded payload
 * @throws UnauthorizedError if token is invalid
 *
 * @example
 * try {
 *   const payload = verifyToken(req.headers.authorization);
 *   // Token is valid, use payload.userId
 * } catch (error) {
 *   // Token is invalid or expired
 * }
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

/**
 * Extract token from Authorization header
 *
 * Expected format: "Bearer <token>"
 *
 * @param authHeader - Authorization header value
 * @returns Token string
 * @throws UnauthorizedError if format is invalid
 *
 * @example
 * const token = extractTokenFromHeader(req.headers.authorization);
 */
export function extractTokenFromHeader(authHeader?: string): string {
  if (!authHeader) {
    throw new UnauthorizedError('No authorization header provided');
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new UnauthorizedError('Invalid authorization header format');
  }

  const token = parts[1];
  if (!token) {
    throw new UnauthorizedError('Token is missing');
  }

  return token;
}
