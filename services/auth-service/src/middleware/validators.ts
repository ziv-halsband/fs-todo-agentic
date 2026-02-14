import { ValidationError } from '@fs-project/backend-common';
import { body, validationResult } from 'express-validator';


import type { Request, Response, NextFunction } from 'express';

/**
 * Middleware to handle validation errors
 *
 * Must be called after validation chains
 * Collects all errors and throws ValidationError
 */
export const handleValidationErrors = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((error) => error.msg as string)
      .join(', ');

    next(new ValidationError(errorMessages));
    return;
  }

  next();
};

/**
 * Signup Validation Rules
 *
 * Validates:
 * - email: valid format, normalized
 * - password: exists (strength checked in service)
 * - fullName: exists, trimmed, max length
 */
export const validateSignup = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(), // Converts to lowercase, removes dots in Gmail

  body('password')
    .exists()
    .withMessage('Password is required')
    .isString()
    .withMessage('Password must be a string')
    .notEmpty()
    .withMessage('Password cannot be empty'),

  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(
      'Full name can only contain letters, spaces, hyphens, and apostrophes'
    ),

  handleValidationErrors,
];

/**
 * Login Validation Rules
 *
 * Validates:
 * - email: valid format
 * - password: exists
 */
export const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .exists()
    .withMessage('Password is required')
    .notEmpty()
    .withMessage('Password cannot be empty'),

  handleValidationErrors,
];

/**
 * Refresh Token Validation
 *
 * Validates:
 * - refreshToken: exists in body
 */
export const validateRefreshToken = [
  body('refreshToken')
    .exists()
    .withMessage('Refresh token is required')
    .isString()
    .withMessage('Refresh token must be a string')
    .notEmpty()
    .withMessage('Refresh token cannot be empty'),

  handleValidationErrors,
];
