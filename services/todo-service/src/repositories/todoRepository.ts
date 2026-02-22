import { NotFoundError } from '@fs-project/backend-common';

import prisma from '../config/database';

import type { Priority } from '@fs-project/db';

export interface CreateTodoData {
  title: string;
  description?: string | null;
  priority?: Priority;
  dueDate?: Date | null;
  starred?: boolean;
  listId: string;
  userId: string;
}

export interface UpdateTodoData {
  title?: string;
  description?: string | null;
  completed?: boolean;
  starred?: boolean;
  priority?: Priority;
  dueDate?: Date | null;
  listId?: string;
}

export interface TodoFilters {
  listId?: string;
  completed?: boolean;
  priority?: Priority;
  search?: string;
  page?: number;
  limit?: number;
}

const TODO_INCLUDE = { list: true } as const;

class TodoRepository {
  async findAllByUserId(
    userId: string,
    filters?: TodoFilters
  ): Promise<{
    items: Awaited<ReturnType<typeof prisma.todo.findMany>>;
    total: number;
  }> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(filters?.listId && { listId: filters.listId }),
      ...(filters?.completed !== undefined && { completed: filters.completed }),
      ...(filters?.priority && { priority: filters.priority }),
      ...(filters?.search && {
        title: { contains: filters.search, mode: 'insensitive' as const },
      }),
    };

    const [items, total] = await Promise.all([
      prisma.todo.findMany({
        where,
        include: TODO_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.todo.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string, userId: string) {
    return prisma.todo.findFirst({
      where: { id, userId },
      include: TODO_INCLUDE,
    });
  }

  async create(data: CreateTodoData) {
    return prisma.todo.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority ?? 'MEDIUM',
        dueDate: data.dueDate,
        starred: data.starred ?? false,
        userId: data.userId,
        listId: data.listId,
      },
      include: TODO_INCLUDE,
    });
  }

  async update(id: string, userId: string, data: UpdateTodoData) {
    // Atomic ownership check + update: updateMany returns { count } in one query,
    // eliminating the TOCTOU window between a separate findFirst and update.
    const { count } = await prisma.todo.updateMany({
      where: { id, userId },
      data,
    });
    if (count === 0) {
      throw new NotFoundError('Todo not found or access denied');
    }
    // Fetch the updated record with relations after confirming ownership.
    return prisma.todo.findFirst({ where: { id }, include: TODO_INCLUDE });
  }

  async delete(id: string, userId: string): Promise<void> {
    const { count } = await prisma.todo.deleteMany({ where: { id, userId } });
    if (count === 0) {
      throw new NotFoundError('Todo not found or access denied');
    }
  }

  async count(userId: string, completed?: boolean): Promise<number> {
    return prisma.todo.count({
      where: {
        userId,
        ...(completed !== undefined && { completed }),
      },
    });
  }

  async countByList(
    userId: string
  ): Promise<{ listId: string; count: number }[]> {
    const rows = await prisma.todo.groupBy({
      by: ['listId'],
      where: { userId, completed: false },
      _count: { _all: true },
    });
    return rows.map((r) => ({ listId: r.listId, count: r._count._all }));
  }
}

export const todoRepository = new TodoRepository();
