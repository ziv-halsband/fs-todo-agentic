import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { type Request, type Response } from 'express';

// Load .env - dotenv will find it in current working directory
// Use override: true to override any shell environment variables
const result = dotenv.config({ override: true });
console.log('🔧 Loading .env from:', process.cwd());
console.log('🔧 .env loaded:', result.error ? '❌ FAILED' : '✅ SUCCESS');
console.log('🔧 PORT from env:', process.env.PORT);

import { errorHandler } from './middleware';
import { todoRoutes } from './routes';

const app = express();
const port = process.env.PORT || 3002;

// CORS - Allow frontend and other services to make requests
// In production, restrict to specific origins
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true, // Allows cookies to be sent (for JWT in cookies)
  })
);

// Body parser middleware
app.use(express.json());
app.use(cookieParser());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'todo-service' });
});

// Todo routes: /api/todos
app.use('/api/todos', todoRoutes);

// Global error handler (must be last!)
app.use(errorHandler);

app.listen(port, () => {
  console.log(`🚀 Todo service running on port ${port}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
