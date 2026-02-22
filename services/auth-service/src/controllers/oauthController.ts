/**
 * OAuth Controller
 *
 * Handles OAuth authentication flows (Google, Facebook, etc.)
 * Uses Passport.js to handle the complex OAuth dance
 */

import type { Request, Response, NextFunction } from 'express';

/**
 * Google OAuth Callback Handler
 *
 * This is called AFTER Passport authenticates the user with Google.
 * At this point, req.user is populated with the user from our database.
 *
 * We need to:
 * 1. Generate JWT tokens
 * 2. Set HttpOnly cookies
 * 3. Redirect to frontend
 *
 * @param req - Request with user populated by Passport
 * @param res - Response to set cookies and redirect
 */
export const googleCallback = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Passport attaches user to req.user
    const authData = req.user as {
      user: { id: string; email: string; fullName: string };
      accessToken: string;
      refreshToken: string;
    };

    if (!authData) {
      // Should never happen if Passport worked correctly
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=auth_failed`
      );
    }

    // Set JWT tokens in HttpOnly cookies
    res.cookie('accessToken', authData.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', authData.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect to frontend dashboard
    // Frontend will automatically have the cookies!
    return res.redirect(`${process.env.FRONTEND_URL}/tasks`);
  } catch (error) {
    next(error);
  }
};

/**
 * OAuth Error Handler
 *
 * Called if OAuth authentication fails
 */
export const oauthError = (_req: Request, res: Response) => {
  // Redirect to frontend login with error
  res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
};
