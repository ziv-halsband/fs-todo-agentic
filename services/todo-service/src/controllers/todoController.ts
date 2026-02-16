import { todoService } from '../services';

import type { AuthRequest } from '@fs-project/backend-common';
import type { Request, Response, NextFunction } from 'express';


/**
 * Todo Controller
 *
 * Handles HTTP requests for todo operations.
 * Extracts userId from JWT (added by authenticate middleware).
 *
 * Flow: Route → Middleware (auth) → Controller → Service → Repository
 */

/**
 * Get all todos for the authenticated user
 *
 * GET /api/todos
 * Auth: Required
 */
export const getAllTodos = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = (req as AuthRequest).user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const todos = await todoService.getAllTodos(userId);

    return res.status(200).json({
      success: true,
      data: { todos },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single todo by ID
 *
 * GET /api/todos/:id
 * Auth: Required
 */
export const getTodoById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = (req as AuthRequest).user?.userId;
    const { id } = req.params;

    if (!userId || !id) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
      });
    }

    const todo = await todoService.getTodoById(id, userId);

    if (!todo) {
      return res.status(404).json({
        success: false,
        error: 'Todo not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: { todo },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new todo
 *
 * POST /api/todos
 * Body: { title: string, description?: string }
 * Auth: Required
 */
export const createTodo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = (req as AuthRequest).user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { title, description } = req.body as {
      title: string;
      description?: string;
    };

    const todo = await todoService.createTodo(userId, {
      title,
      description,
    });

    return res.status(201).json({
      success: true,
      data: { todo },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing todo
 *
 * PATCH /api/todos/:id
 * Body: { title?: string, description?: string, completed?: boolean }
 * Auth: Required
 */
export const updateTodo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = (req as AuthRequest).user?.userId;
    const { id } = req.params;

    if (!userId || !id) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
      });
    }

    const { title, description, completed } = req.body as {
      title?: string;
      description?: string;
      completed?: boolean;
    };

    const todo = await todoService.updateTodo(id, userId, {
      title,
      description,
      completed,
    });

    return res.status(200).json({
      success: true,
      data: { todo },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a todo
 *
 * DELETE /api/todos/:id
 * Auth: Required
 */
export const deleteTodo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = (req as AuthRequest).user?.userId;
    const { id } = req.params;

    if (!userId || !id) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
      });
    }

    await todoService.deleteTodo(id, userId);

    return res.status(200).json({
      success: true,
      message: 'Todo deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get todo statistics
 *
 * GET /api/todos/stats
 * Auth: Required
 */
export const getTodoStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = (req as AuthRequest).user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const stats = await todoService.getTodoStats(userId);

    return res.status(200).json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
};
