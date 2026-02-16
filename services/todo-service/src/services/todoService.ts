import { ValidationError } from '@fs-project/backend-common';

import {
  todoRepository,
  type CreateTodoData,
  type UpdateTodoData,
} from '../repositories';

import type { Todo } from '../generated/prisma';


/**
 * Todo Service
 *
 * Business logic layer for todo operations.
 * Validates input and coordinates with repository.
 *
 * Follows the Service pattern:
 * Controller → Service → Repository → Database
 */
class TodoService {
  /**
   * Get all todos for a user
   *
   * @param userId - User ID from JWT token
   * @returns Array of todos
   */
  async getAllTodos(userId: string): Promise<Todo[]> {
    return todoRepository.findAllByUserId(userId);
  }

  /**
   * Get a single todo by ID
   *
   * @param id - Todo ID
   * @param userId - User ID from JWT token
   * @returns Todo or null
   */
  async getTodoById(id: string, userId: string): Promise<Todo | null> {
    return todoRepository.findById(id, userId);
  }

  /**
   * Create a new todo
   *
   * @param userId - User ID from JWT token
   * @param data - Todo creation data
   * @returns Created todo
   * @throws ValidationError if title is invalid
   */
  async createTodo(
    userId: string,
    data: { title: string; description?: string }
  ): Promise<Todo> {
    // Business validation
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

    const createData: CreateTodoData = {
      title: data.title.trim(),
      description: data.description?.trim() || null,
      userId,
    };

    return todoRepository.create(createData);
  }

  /**
   * Update an existing todo
   *
   * @param id - Todo ID
   * @param userId - User ID from JWT token
   * @param data - Fields to update
   * @returns Updated todo
   * @throws ValidationError if data is invalid
   * @throws NotFoundError if todo doesn't exist or user doesn't own it
   */
  async updateTodo(
    id: string,
    userId: string,
    data: { title?: string; description?: string; completed?: boolean }
  ): Promise<Todo> {
    // Business validation
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
    if (data.title !== undefined) {
      updateData.title = data.title.trim();
    }
    if (data.description !== undefined) {
      updateData.description = data.description.trim() || null;
    }
    if (data.completed !== undefined) {
      updateData.completed = data.completed;
    }

    return todoRepository.update(id, userId, updateData);
  }

  /**
   * Delete a todo
   *
   * @param id - Todo ID
   * @param userId - User ID from JWT token
   * @throws NotFoundError if todo doesn't exist or user doesn't own it
   */
  async deleteTodo(id: string, userId: string): Promise<void> {
    return todoRepository.delete(id, userId);
  }

  /**
   * Get todo statistics for a user
   *
   * @param userId - User ID from JWT token
   * @returns Todo counts
   */
  async getTodoStats(userId: string): Promise<{
    total: number;
    completed: number;
    active: number;
  }> {
    const [total, completed] = await Promise.all([
      todoRepository.count(userId),
      todoRepository.count(userId, true),
    ]);

    return {
      total,
      completed,
      active: total - completed,
    };
  }
}

// Export singleton instance
export const todoService = new TodoService();
