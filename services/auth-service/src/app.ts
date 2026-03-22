import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express, type Request, type Response } from 'express';
import passport from 'passport';

import './config/passport';
import { errorHandler } from './middleware';
import { authRoutes, oauthRoutes } from './routes';

export const app: Express = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

app.use('/auth', authRoutes);
app.use('/auth', oauthRoutes);

app.use(errorHandler);
