import { AppError } from '@fs-project/backend-common';

import type { Request, Response, NextFunction } from 'express';

/**
 * Global Error Handler Middleware
 *
 * Catches all errors and returns consistent JSON responses.
 * Must be the LAST middleware in the app.
 *
 * Error Flow:
 * 1. Controller/Middleware throws error
 * 2. Express catches it and passes to next(error)
 * 3. This middleware formats and sends response
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  // Log error for debugging
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Handle known AppError types (from backend-common)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // Handle unknown errors (500 Internal Server Error)
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && {
      message: err.message,
      stack: err.stack,
    }),
  });
};
