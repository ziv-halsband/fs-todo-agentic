/**
 * OAuth Routes
 *
 * Handles OAuth authentication flows using Passport.js
 *
 * Routes:
 * GET /oauth/google          - Initiate Google OAuth (redirects to Google)
 * GET /oauth/google/callback - Google redirects here after user auth
 */

import { Router, type Router as RouterType } from 'express';

import passport from '../config/passport';
import { oauthController } from '../controllers';

const router: RouterType = Router();

const isGoogleConfigured =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

if (isGoogleConfigured) {
  /**
   * GET /oauth/google
   *
   * Initiates Google OAuth flow
   */
  router.get(
    '/google',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false,
      prompt: 'select_account',
    })
  );

  /**
   * GET /oauth/google/callback
   *
   * Google redirects here after user authenticates
   */
  router.get(
    '/google/callback',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    passport.authenticate('google', {
      session: false,
      failureRedirect: '/oauth/error',
    }),
    oauthController.googleCallback
  );
} else {
  // Return a clear error instead of crashing
  router.get('/google', (_req, res) => {
    res.status(501).json({
      success: false,
      error: { message: 'Google OAuth is not configured', code: 501 },
    });
  });
}

/**
 * GET /oauth/error
 *
 * Fallback if OAuth fails
 */
router.get('/error', oauthController.oauthError);

export default router;
