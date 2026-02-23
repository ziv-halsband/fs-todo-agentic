import { useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

import { getTodos, type TodoQueryParams } from '../services/todoService';
import { useTodoStore } from '../store/todoStore';
import { TODOS_QUERY_KEY } from '../lib/queryClient';

/**
 * Fetches todos for the given filters using React Query.
 *
 * Cache key: [TODOS_QUERY_KEY, filters]
 * - Identical filter objects hit the cache — no network request fired.
 * - staleTime: 30s (set on the QueryClient default).
 * - keepPreviousData: prevents a loading flash when changing page/filters.
 */
export function useTodosQuery(filters: TodoQueryParams, enabled = true) {
  const setTodos = useTodoStore((s) => s.setTodos);

  const query = useQuery({
    queryKey: [TODOS_QUERY_KEY, filters],
    queryFn: () => getTodos(filters),
    placeholderData: keepPreviousData,
    enabled,
  });

  // Keep Zustand's todos in sync so toggleStar can look up the current value.
  useEffect(() => {
    if (query.data) {
      setTodos(query.data.todos);
    }
  }, [query.data, setTodos]);

  return query;
}
