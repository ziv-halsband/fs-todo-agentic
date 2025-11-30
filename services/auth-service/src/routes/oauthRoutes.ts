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

/**
 * GET /oauth/google
 *
 * Initiates Google OAuth flow
 *
 * What happens:
 * 1. User clicks "Login with Google" on frontend
 * 2. Frontend redirects to this endpoint
 * 3. Passport redirects user to Google's login page
 * 4. User logs in with Google
 * 5. Google redirects to /oauth/google/callback
 *
 * Passport handles all the OAuth complexity!
 */
router.get(
  '/google',
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  passport.authenticate('google', {
    scope: ['profile', 'email'], // What we request from Google
    session: false, // We use JWT, not sessions
  })
);

/**
 * GET /oauth/google/callback
 *
 * Google redirects here after user authenticates
 *
 * What happens:
 * 1. Google sends authorization code
 * 2. Passport exchanges code for user info
 * 3. Our Passport strategy creates/finds user in DB
 * 4. Controller sets JWT cookies
 * 5. Redirects to frontend dashboard
 *
 * Success: User is logged in with cookies set
 * Failure: Redirects to login with error
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

/**
 * GET /oauth/error
 *
 * Fallback if OAuth fails
 */
router.get('/error', oauthController.oauthError);

export default router;
