import { todoService } from '../services';

import type { AuthRequest } from '@fs-project/backend-common';
import type { Request, Response, NextFunction } from 'express';

/**
 * GET /api/todos
 * Query params: listId?, completed?, priority?, search?, page?, limit?
 */
export const getAllTodos = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = (req as AuthRequest).user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { listId, completed, priority, search, page, limit } =
      req.query as Record<string, string | undefined>;

    const filters = {
      listId: listId || undefined,
      completed:
        completed === 'true' ? true : completed === 'false' ? false : undefined,
      priority: priority as import('@fs-project/db').Priority | undefined,
      search: search?.trim() || undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    };

    const { items: todos, total } = await todoService.getAllTodos(
      userId,
      filters
    );
    const resolvedPage = filters.page ?? 1;
    const resolvedLimit = filters.limit ?? 50;

    return res.status(200).json({
      success: true,
      data: { todos, total, page: resolvedPage, limit: resolvedLimit },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/todos/count
 * Returns incomplete task counts grouped by list, plus the total.
 */
export const getCountsByList = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = (req as AuthRequest).user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const data = await todoService.getCountsByList(userId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/todos/stats
 */
export const getTodoStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = (req as AuthRequest).user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const stats = await todoService.getTodoStats(userId);
    return res.status(200).json({ success: true, data: { stats } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/todos/:id
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
      return res.status(400).json({ success: false, error: 'Invalid request' });
    }
    const todo = await todoService.getTodoById(id, userId);
    if (!todo) {
      return res.status(404).json({ success: false, error: 'Todo not found' });
    }
    return res.status(200).json({ success: true, data: { todo } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/todos
 * Body: { title, description?, priority?, dueDate?, starred?, listId }
 */
export const createTodo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = (req as AuthRequest).user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { title, description, priority, dueDate, starred, listId } =
      req.body as {
        title: string;
        description?: string;
        priority?: string;
        dueDate?: string;
        starred?: boolean;
        listId: string;
      };

    const todo = await todoService.createTodo(userId, {
      title,
      description,
      priority,
      dueDate,
      starred,
      listId,
    });

    return res.status(201).json({ success: true, data: { todo } });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/todos/:id
 * Body: { title?, description?, completed?, starred?, priority?, dueDate?, listId? }
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
      return res.status(400).json({ success: false, error: 'Invalid request' });
    }

    const {
      title,
      description,
      completed,
      starred,
      priority,
      dueDate,
      listId,
    } = req.body as {
      title?: string;
      description?: string;
      completed?: boolean;
      starred?: boolean;
      priority?: string;
      dueDate?: string | null;
      listId?: string;
    };

    const todo = await todoService.updateTodo(id, userId, {
      title,
      description,
      completed,
      starred,
      priority,
      dueDate,
      listId,
    });

    return res.status(200).json({ success: true, data: { todo } });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/todos/:id
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
      return res.status(400).json({ success: false, error: 'Invalid request' });
    }
    await todoService.deleteTodo(id, userId);
    return res
      .status(200)
      .json({ success: true, message: 'Todo deleted successfully' });
  } catch (error) {
    next(error);
  }
};
