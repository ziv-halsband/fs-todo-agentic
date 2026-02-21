// =============================================================
// @fs-project/common
// Single source of truth for types shared between FE and BE.
// Any contract change here will cause a compile error on both sides.
// =============================================================

// ── Enums ────────────────────────────────────────────────────

export enum UserRole {
  USER = 'USER',
  EDITOR = 'EDITOR',
  ADMIN = 'ADMIN',
}

export enum AuthProvider {
  EMAIL = 'EMAIL',
  GOOGLE = 'GOOGLE',
}

export enum Priority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

// ── Domain types ─────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl: string | null;
  provider: AuthProvider;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface List {
  id: string;
  name: string;
  icon: string;
  color: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  starred: boolean;
  priority: Priority;
  dueDate: string | null;
  listId: string;
  userId: string;
  list: Pick<List, 'id' | 'name' | 'icon' | 'color'>;
  createdAt: string;
  updatedAt: string;
}

// ── API response wrappers ─────────────────────────────────────

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
}

// ── Todo request inputs ───────────────────────────────────────

export interface CreateTodoInput {
  title: string;
  description?: string;
  priority?: Priority;
  listId: string;
  dueDate?: string;
  starred?: boolean;
}

export interface UpdateTodoInput {
  title?: string;
  description?: string;
  completed?: boolean;
  starred?: boolean;
  priority?: Priority;
  listId?: string;
  dueDate?: string | null;
}

// ── List request inputs ───────────────────────────────────────

export interface CreateListInput {
  name: string;
  icon?: string;
  color?: string;
}

export interface UpdateListInput {
  name?: string;
  icon?: string;
  color?: string;
}
