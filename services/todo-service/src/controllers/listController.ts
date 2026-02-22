import { listRepository } from '../repositories';

import type { AuthRequest } from '@fs-project/backend-common';
import type { Request, Response, NextFunction } from 'express';

/**
 * GET /api/lists
 */
export const getAllLists = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = (req as AuthRequest).user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const lists = await listRepository.findAllByUserId(userId);
    return res.status(200).json({ success: true, data: { lists } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/lists
 * Body: { name, icon?, color? }
 */
export const createList = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = (req as AuthRequest).user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { name, icon, color } = req.body as {
      name: string;
      icon?: string;
      color?: string;
    };

    if (!name || name.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, error: 'List name is required' });
    }

    const list = await listRepository.create({
      name: name.trim(),
      icon,
      color,
      userId,
    });

    return res.status(201).json({ success: true, data: { list } });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/lists/:id
 * Body: { name?, icon?, color? }
 */
export const updateList = async (
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

    const { name, icon, color } = req.body as {
      name?: string;
      icon?: string;
      color?: string;
    };

    const list = await listRepository.update(id, userId, { name, icon, color });
    return res.status(200).json({ success: true, data: { list } });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/lists/:id
 */
export const deleteList = async (
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
    await listRepository.delete(id, userId);
    return res
      .status(200)
      .json({ success: true, message: 'List deleted successfully' });
  } catch (error) {
    next(error);
  }
};
