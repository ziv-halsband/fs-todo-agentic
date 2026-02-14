/**
 * Centralized Error Handler Middleware
 *
 * Catches all errors and formats consistent responses
 * Must be last middleware in Express app
 */

import { AppError } from '@fs-project/backend-common';

import type { Request, Response, NextFunction } from 'express';

/**
 * Error response format
 */
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: number;
    details?: unknown;
  };
}

/**
 * Global error handler
 *
 * Handles:
 * - Operational errors (expected, like ValidationError)
 * - Programming errors (unexpected, like null reference)
 *
 * @param err - Error object
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function (required for Express)
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Operational error (expected)
  if (err instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      error: {
        message: err.message,
        code: err.statusCode,
      },
    };

    return res.status(err.statusCode).json(response);
  }

  // Programming error (unexpected)
  console.error('Unexpected error:', err);

  const response: ErrorResponse = {
    success: false,
    error: {
      message: 'Internal server error',
      code: 500,
      // In development, include stack trace
      ...(process.env.NODE_ENV === 'development' && {
        details: err.message,
      }),
    },
  };

  return res.status(500).json(response);
};
