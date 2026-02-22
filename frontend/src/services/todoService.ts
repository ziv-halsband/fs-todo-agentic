import { todoApi } from './api';

// ── Types ────────────────────────────────────────────────────

export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  completed: boolean;
  starred: boolean;
  priority: Priority;
  dueDate?: string | null;
  listId: string;
  listName: string;
  listColor: string;
  listIcon: string;
}

export interface List {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority: Priority;
  listId: string;
  dueDate?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  completed?: boolean;
  starred?: boolean;
  priority?: Priority;
  dueDate?: string | null;
  listId?: string;
}

// ── Mappers ──────────────────────────────────────────────────

// Converts the backend Todo (uppercase priority, nested list) to frontend Task
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTodo(raw: any): Task {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description ?? null,
    completed: raw.completed,
    starred: raw.starred,
    priority: (raw.priority as string).toLowerCase() as Priority,
    dueDate: raw.dueDate ?? null,
    listId: raw.listId,
    listName: raw.list?.name ?? '',
    listColor: raw.list?.color ?? '#6C5CE7',
    listIcon: raw.list?.icon ?? 'list',
  };
}

// ── API calls ────────────────────────────────────────────────

export async function getLists(): Promise<List[]> {
  const res = await todoApi.get<{ success: boolean; data: { lists: List[] } }>(
    '/api/lists'
  );
  return res.data.data.lists;
}

export async function createList(data: {
  name: string;
  icon?: string;
  color?: string;
}): Promise<List> {
  const res = await todoApi.post<{ success: boolean; data: { list: List } }>(
    '/api/lists',
    data
  );
  return res.data.data.list;
}

export async function deleteList(id: string): Promise<void> {
  await todoApi.delete(`/api/lists/${id}`);
}

export interface TodoQueryParams {
  listId?: string;
  completed?: boolean;
  priority?: Priority;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TodosPage {
  todos: Task[];
  total: number;
  page: number;
  limit: number;
}

export async function getTodos(filters?: TodoQueryParams): Promise<TodosPage> {
  const params = new URLSearchParams();
  if (filters?.listId) params.set('listId', filters.listId);
  if (filters?.completed !== undefined)
    params.set('completed', String(filters.completed));
  if (filters?.priority) params.set('priority', filters.priority.toUpperCase());
  if (filters?.search) params.set('search', filters.search);
  if (filters?.page !== undefined) params.set('page', String(filters.page));
  if (filters?.limit !== undefined) params.set('limit', String(filters.limit));

  const res = await todoApi.get<{
    success: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { todos: any[]; total: number; page: number; limit: number };
  }>(`/api/todos${params.toString() ? `?${params.toString()}` : ''}`);

  return {
    todos: res.data.data.todos.map(mapTodo),
    total: res.data.data.total,
    page: res.data.data.page,
    limit: res.data.data.limit,
  };
}

export async function createTodo(data: CreateTaskInput): Promise<Task> {
  const res = await todoApi.post<{
    success: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { todo: any };
  }>('/api/todos', {
    ...data,
    priority: data.priority.toUpperCase(),
  });
  return mapTodo(res.data.data.todo);
}

export async function updateTodo(
  id: string,
  data: UpdateTaskInput
): Promise<Task> {
  const payload = {
    ...data,
    ...(data.priority && { priority: data.priority.toUpperCase() }),
  };
  const res = await todoApi.patch<{
    success: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { todo: any };
  }>(`/api/todos/${id}`, payload);
  return mapTodo(res.data.data.todo);
}

export async function deleteTodo(id: string): Promise<void> {
  await todoApi.delete(`/api/todos/${id}`);
}

export interface TaskCounts {
  counts: { listId: string; count: number }[];
  total: number;
}

export async function getTaskCounts(): Promise<TaskCounts> {
  const res = await todoApi.get<{ success: boolean; data: TaskCounts }>(
    '/api/todos/count'
  );
  return res.data.data;
}
