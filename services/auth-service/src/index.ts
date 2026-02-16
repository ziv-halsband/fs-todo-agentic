import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { type Request, type Response } from 'express';
import passport from 'passport';

// Debug: Check if PORT is already set before loading .env
console.log('🔧 PORT before dotenv:', process.env.PORT);

// Load .env file and OVERRIDE any existing environment variables
const result = dotenv.config({ override: true });
console.log('🔧 Loading .env from:', process.cwd());
console.log('🔧 .env loaded:', result.error ? '❌ FAILED' : '✅ SUCCESS');
console.log('🔧 PORT after dotenv:', process.env.PORT);

import './config/passport'; // Initialize Passport strategies
import { errorHandler } from './middleware';
import { authRoutes, oauthRoutes } from './routes';

const app = express();
const port = process.env.PORT || 3001;

// CORS - Allow frontend to make requests
// In production, restrict to specific origins
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true, // ← IMPORTANT: Allows cookies to be sent!
  })
);

app.use(express.json());
app.use(cookieParser());

// Initialize Passport
app.use(passport.initialize());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

// Auth routes: /auth/signup, /auth/login, etc.
app.use('/auth', authRoutes);

// OAuth routes: /auth/google, /auth/google/callback
app.use('/auth', oauthRoutes);

app.use(errorHandler);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 Auth service running on port ${port}`);
  // eslint-disable-next-line no-console
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
