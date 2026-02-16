/**
 * Passport Configuration
 *
 * Sets up authentication strategies:
 * - Google OAuth 2.0
 *
 * Passport handles the complex OAuth flow:
 * 1. Redirects user to Google
 * 2. User logs in with Google
 * 3. Google redirects back with code
 * 4. Passport exchanges code for user info
 * 5. We create/find user in our database
 */

import { AuthProvider } from '@fs-project/common';
import dotenv from 'dotenv';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

import { authService } from '../services';

// Load environment variables FIRST
dotenv.config({ override: true });

/**
 * Configure Google OAuth Strategy
 *
 * Flow:
 * 1. User clicks "Login with Google"
 * 2. Redirected to Google login
 * 3. User authorizes our app
 * 4. Google calls our callback with profile
 * 5. We find or create user
 * 6. Return user to Passport
 */
// Only register Google OAuth if credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
        scope: ['profile', 'email'], // What we want from Google
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          // Extract user info from Google profile
          const email = profile.emails?.[0]?.value;
          const fullName = profile.displayName;
          const avatarUrl = profile.photos?.[0]?.value;
          const googleId = profile.id;

          if (!email) {
            return done(new Error('No email from Google'), undefined);
          }

          // Find or create user in our database
          const user = await authService.findOrCreateOAuthUser({
            email,
            fullName,
            avatarUrl,
            provider: AuthProvider.GOOGLE,
            providerId: googleId,
          });

          // Success! Return user to Passport
          return done(null, user);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );
} else {
  console.log(
    '⚠️  Google OAuth not configured (GOOGLE_CLIENT_ID missing) - skipping'
  );
}

/**
 * Serialize User
 *
 * NOT USED in our JWT approach!
 * We use stateless JWT instead of sessions.
 * These are required by Passport but we don't use them.
 */
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user as Express.User);
});

export default passport;
