import { useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

import {
  getTodos,
  type TodoQueryParams,
  type Task,
} from '../services/todoService';
import { useTodoStore } from '../store/todoStore';
import { TODOS_QUERY_KEY } from '../lib/queryClient';

type BaseFilters = Omit<TodoQueryParams, 'completed' | 'page' | 'limit'>;

interface StreamResult {
  todos: Task[];
  total: number;
  isLoading: boolean;
  isError: boolean;
}

export interface DualTodosResult {
  open: StreamResult;
  completed: StreamResult;
}

export function useDualTodosQuery(
  baseFilters: BaseFilters,
  openPage: number,
  completedPage: number,
  pageSize: number,
  enabled = true
): DualTodosResult {
  const setTodos = useTodoStore((s) => s.setTodos);

  const openQuery = useQuery({
    queryKey: [
      TODOS_QUERY_KEY,
      'open',
      { ...baseFilters, page: openPage, limit: pageSize },
    ],
    queryFn: () =>
      getTodos({
        ...baseFilters,
        completed: false,
        page: openPage,
        limit: pageSize,
      }),
    placeholderData: keepPreviousData,
    enabled,
  });

  const completedQuery = useQuery({
    queryKey: [
      TODOS_QUERY_KEY,
      'completed',
      { ...baseFilters, page: completedPage, limit: pageSize },
    ],
    queryFn: () =>
      getTodos({
        ...baseFilters,
        completed: true,
        page: completedPage,
        limit: pageSize,
      }),
    placeholderData: keepPreviousData,
    enabled,
  });

  useEffect(() => {
    const openTodos = openQuery.data?.todos ?? [];
    const completedTodos = completedQuery.data?.todos ?? [];
    setTodos([...openTodos, ...completedTodos]);
  }, [openQuery.data, completedQuery.data, setTodos]);

  return {
    open: {
      todos: openQuery.data?.todos ?? [],
      total: openQuery.data?.total ?? 0,
      isLoading: openQuery.isLoading,
      isError: openQuery.isError,
    },
    completed: {
      todos: completedQuery.data?.todos ?? [],
      total: completedQuery.data?.total ?? 0,
      isLoading: completedQuery.isLoading,
      isError: completedQuery.isError,
    },
  };
}
