import { create } from 'zustand';

import * as todoService from '../services/todoService';
import type {
  Task,
  List,
  CreateTaskInput,
  UpdateTaskInput,
} from '../services/todoService';
import { queryClient, TODOS_QUERY_KEY } from '../lib/queryClient';

export interface ListCounts {
  /** Incomplete task count per listId. */
  byList: Record<string, number>;
  /** Total incomplete tasks across all lists. */
  total: number;
}

interface TodoState {
  /** Last page of todos received — kept in sync by useTodosQuery for optimistic toggles. */
  todos: Task[];
  lists: List[];
  counts: ListCounts;
  error: string | null;

  setTodos: (todos: Task[]) => void;
  fetchLists: () => Promise<void>;
  fetchCounts: () => Promise<void>;
  incrementCount: (listId: string) => void;
  decrementCount: (listId: string) => void;
  createList: (data: {
    name: string;
    icon?: string;
    color?: string;
  }) => Promise<void>;
  addTodo: (data: CreateTaskInput) => Promise<void>;
  editTodo: (id: string, data: UpdateTaskInput) => Promise<void>;
  removeTodo: (id: string, listId: string) => Promise<void>;
  toggleComplete: (
    id: string,
    listId: string,
    currentCompleted: boolean
  ) => Promise<void>;
  toggleStar: (id: string) => Promise<void>;
}

export const useTodoStore = create<TodoState>((set) => ({
  todos: [],
  lists: [],
  counts: { byList: {}, total: 0 },
  error: null,

  setTodos: (todos) => set({ todos }),

  fetchLists: async () => {
    try {
      const lists = await todoService.getLists();
      set({ lists });
    } catch {
      set({ error: 'Failed to load lists' });
    }
  },

  fetchCounts: async () => {
    try {
      const { counts, total } = await todoService.getTaskCounts();
      const byList: Record<string, number> = {};
      counts.forEach(({ listId, count }) => {
        byList[listId] = count;
      });
      set({ counts: { byList, total } });
    } catch {
      set({ error: 'Failed to load counts' });
    }
  },

  incrementCount: (listId) =>
    set((s) => ({
      counts: {
        byList: {
          ...s.counts.byList,
          [listId]: (s.counts.byList[listId] ?? 0) + 1,
        },
        total: s.counts.total + 1,
      },
    })),

  decrementCount: (listId) =>
    set((s) => ({
      counts: {
        byList: {
          ...s.counts.byList,
          [listId]: Math.max(0, (s.counts.byList[listId] ?? 0) - 1),
        },
        total: Math.max(0, s.counts.total - 1),
      },
    })),

  createList: async (data) => {
    set({ error: null });
    try {
      const list = await todoService.createList(data);
      set((s) => ({ lists: [...s.lists, list] }));
    } catch (e) {
      set({ error: 'Failed to create list' });
      throw e;
    }
  },

  addTodo: async (data) => {
    set({ error: null });
    try {
      await todoService.createTodo(data);
      queryClient.invalidateQueries({ queryKey: [TODOS_QUERY_KEY] });
      // Immediately reflect new incomplete task in sidebar counts.
      useTodoStore.getState().incrementCount(data.listId);
    } catch (e) {
      set({ error: 'Failed to create task' });
      throw e;
    }
  },

  editTodo: async (id, data) => {
    set({ error: null });
    try {
      await todoService.updateTodo(id, data);
      queryClient.invalidateQueries({ queryKey: [TODOS_QUERY_KEY] });
    } catch (e) {
      set({ error: 'Failed to update task' });
      throw e;
    }
  },

  removeTodo: async (id, listId) => {
    set({ error: null });
    try {
      await todoService.deleteTodo(id);
      queryClient.invalidateQueries({ queryKey: [TODOS_QUERY_KEY] });
      useTodoStore.getState().decrementCount(listId);
    } catch (e) {
      set({ error: 'Failed to delete task' });
      throw e;
    }
  },

  toggleComplete: async (id, listId, currentCompleted) => {
    set({ error: null });
    const newCompleted = !currentCompleted;
    try {
      await todoService.updateTodo(id, { completed: newCompleted });
      queryClient.invalidateQueries({ queryKey: [TODOS_QUERY_KEY] });
      // Completing a task removes it from the incomplete bucket; un-completing adds it back.
      if (newCompleted) {
        useTodoStore.getState().decrementCount(listId);
      } else {
        useTodoStore.getState().incrementCount(listId);
      }
    } catch {
      set({ error: 'Failed to update task' });
    }
  },

  toggleStar: async (id) => {
    set({ error: null });
    try {
      const current = useTodoStore.getState().todos.find((t) => t.id === id);
      await todoService.updateTodo(id, {
        starred: !(current?.starred ?? false),
      });
      queryClient.invalidateQueries({ queryKey: [TODOS_QUERY_KEY] });
    } catch {
      set({ error: 'Failed to update task' });
    }
  },
}));
