import { ValidationError, NotFoundError } from '@fs-project/backend-common';

import {
  todoRepository,
  listRepository,
  type CreateTodoData,
  type UpdateTodoData,
  type TodoFilters,
} from '../repositories';

import type { Priority } from '@fs-project/db';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

const VALID_PRIORITIES: Priority[] = ['HIGH', 'MEDIUM', 'LOW'];

class TodoService {
  async getAllTodos(userId: string, filters?: TodoFilters) {
    const limit = Math.min(filters?.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const page = Math.max(filters?.page ?? 1, 1);
    return todoRepository.findAllByUserId(userId, { ...filters, limit, page });
  }

  async getTodoById(id: string, userId: string) {
    return todoRepository.findById(id, userId);
  }

  async createTodo(
    userId: string,
    data: {
      title: string;
      description?: string;
      priority?: string;
      dueDate?: string;
      starred?: boolean;
      listId: string;
    }
  ) {
    if (!data.title || data.title.trim().length === 0) {
      throw new ValidationError('Title is required');
    }
    if (data.title.length > 255) {
      throw new ValidationError('Title must be less than 255 characters');
    }
    if (data.description && data.description.length > 1000) {
      throw new ValidationError(
        'Description must be less than 1000 characters'
      );
    }
    if (!data.listId) {
      throw new ValidationError('listId is required');
    }

    await this.verifyListOwnership(data.listId, userId);

    const priority = this.parsePriority(data.priority) ?? 'MEDIUM';

    const createData: CreateTodoData = {
      title: data.title.trim(),
      description: data.description?.trim() || null,
      priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      starred: data.starred ?? false,
      listId: data.listId,
      userId,
    };

    return todoRepository.create(createData);
  }

  async updateTodo(
    id: string,
    userId: string,
    data: {
      title?: string;
      description?: string;
      completed?: boolean;
      starred?: boolean;
      priority?: string;
      dueDate?: string | null;
      listId?: string;
    }
  ) {
    if (data.title !== undefined) {
      if (data.title.trim().length === 0) {
        throw new ValidationError('Title cannot be empty');
      }
      if (data.title.length > 255) {
        throw new ValidationError('Title must be less than 255 characters');
      }
    }
    if (data.description !== undefined && data.description.length > 1000) {
      throw new ValidationError(
        'Description must be less than 1000 characters'
      );
    }

    const updateData: UpdateTodoData = {};
    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.description !== undefined)
      updateData.description = data.description.trim() || null;
    if (data.completed !== undefined) updateData.completed = data.completed;
    if (data.starred !== undefined) updateData.starred = data.starred;
    if (data.priority !== undefined) {
      const p = this.parsePriority(data.priority);
      if (p) updateData.priority = p;
    }
    if ('dueDate' in data) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }
    if (data.listId !== undefined) {
      await this.verifyListOwnership(data.listId, userId);
      updateData.listId = data.listId;
    }

    return todoRepository.update(id, userId, updateData);
  }

  async deleteTodo(id: string, userId: string): Promise<void> {
    return todoRepository.delete(id, userId);
  }

  async getTodoStats(
    userId: string
  ): Promise<{ total: number; completed: number; active: number }> {
    const [total, completed] = await Promise.all([
      todoRepository.count(userId),
      todoRepository.count(userId, true),
    ]);
    return { total, completed, active: total - completed };
  }

  async getCountsByList(
    userId: string
  ): Promise<{ counts: { listId: string; count: number }[]; total: number }> {
    const counts = await todoRepository.countByList(userId);
    const total = counts.reduce((sum, r) => sum + r.count, 0);
    return { counts, total };
  }

  private parsePriority(value?: string): Priority | undefined {
    if (!value) return undefined;
    const upper = value.toUpperCase() as Priority;
    if (!VALID_PRIORITIES.includes(upper)) {
      throw new ValidationError(
        `Invalid priority "${value}". Must be one of: high, medium, low`
      );
    }
    return upper;
  }

  private async verifyListOwnership(
    listId: string,
    userId: string
  ): Promise<void> {
    const list = await listRepository.findById(listId, userId);
    if (!list) {
      throw new NotFoundError('List not found or access denied');
    }
  }
}

export const todoService = new TodoService();
