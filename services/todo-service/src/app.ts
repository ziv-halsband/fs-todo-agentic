import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express, type Request, type Response } from 'express';

import { errorHandler } from './middleware';
import { todoRoutes, listRoutes } from './routes';

export const app: Express = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'todo-service' });
});

app.use('/api/todos', todoRoutes);
app.use('/api/lists', listRoutes);

app.use(errorHandler);
