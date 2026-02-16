import { NotFoundError } from '@fs-project/backend-common';

import prisma from '../config/database';

import type { Todo } from '../generated/prisma';


/**
 * Data Transfer Objects (DTOs)
 * These define the shape of data going in/out of repository
 */

export interface CreateTodoData {
  title: string;
  description?: string | null;
  userId: string;
}

export interface UpdateTodoData {
  title?: string;
  description?: string | null;
  completed?: boolean;
}

/**
 * Todo Repository
 *
 * Handles all database operations for todos.
 * Follows the Repository pattern for clean separation of concerns.
 *
 * Business Rules:
 * - Users can only access their own todos
 * - All operations verify userId ownership
 */
class TodoRepository {
  /**
   * Find all todos for a specific user
   *
   * @param userId - User ID from JWT token
   * @returns Array of todos
   */
  async findAllByUserId(userId: string): Promise<Todo[]> {
    return prisma.todo.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }, // Newest first
    });
  }

  /**
   * Find a specific todo by ID
   * Verifies ownership (userId must match)
   *
   * @param id - Todo ID
   * @param userId - User ID from JWT token
   * @returns Todo or null if not found/not owned
   */
  async findById(id: string, userId: string): Promise<Todo | null> {
    return prisma.todo.findFirst({
      where: {
        id,
        userId, // Ensures user owns this todo
      },
    });
  }

  /**
   * Create a new todo
   *
   * @param data - Todo data (title, description, userId)
   * @returns Created todo
   */
  async create(data: CreateTodoData): Promise<Todo> {
    return prisma.todo.create({
      data: {
        title: data.title,
        description: data.description,
        userId: data.userId,
      },
    });
  }

  /**
   * Update an existing todo
   * Verifies ownership before updating
   *
   * @param id - Todo ID
   * @param userId - User ID from JWT token
   * @param data - Fields to update
   * @returns Updated todo
   * @throws NotFoundError if todo doesn't exist or user doesn't own it
   */
  async update(
    id: string,
    userId: string,
    data: UpdateTodoData
  ): Promise<Todo> {
    // First, verify the todo exists and user owns it
    const existingTodo = await this.findById(id, userId);
    if (!existingTodo) {
      throw new NotFoundError('Todo not found or access denied');
    }

    return prisma.todo.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a todo
   * Verifies ownership before deleting
   *
   * @param id - Todo ID
   * @param userId - User ID from JWT token
   * @throws NotFoundError if todo doesn't exist or user doesn't own it
   */
  async delete(id: string, userId: string): Promise<void> {
    // First, verify the todo exists and user owns it
    const existingTodo = await this.findById(id, userId);
    if (!existingTodo) {
      throw new NotFoundError('Todo not found or access denied');
    }

    await prisma.todo.delete({
      where: { id },
    });
  }

  /**
   * Count todos for a user (optional, for future stats)
   *
   * @param userId - User ID
   * @param completed - Filter by completion status
   * @returns Count of todos
   */
  async count(userId: string, completed?: boolean): Promise<number> {
    return prisma.todo.count({
      where: {
        userId,
        ...(completed !== undefined && { completed }),
      },
    });
  }
}

// Export singleton instance
export const todoRepository = new TodoRepository();
