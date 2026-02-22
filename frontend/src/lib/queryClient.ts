import { QueryClient } from '@tanstack/react-query';

/**
 * TODOS_QUERY_KEY is the cache bucket identifier for all todo list queries.
 * The full key is always [TODOS_QUERY_KEY, filters] so that:
 *   - Different filter combinations are cached separately
 *   - invalidateQueries({ queryKey: [TODOS_QUERY_KEY] }) busts ALL todo pages at once
 */
export const TODOS_QUERY_KEY = 'todos' as const;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // cached result is "fresh" for 30s — no re-fetch for same key
      retry: 1,
    },
  },
});
