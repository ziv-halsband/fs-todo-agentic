/**
 * api.ts - Base API configuration with Axios
 */

import axios from 'axios';
import type {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';

// Service URLs
const API_BASE_URL: string =
  import.meta.env.VITE_API_URL || 'http://localhost:3001';

const TODO_API_BASE_URL: string =
  import.meta.env.VITE_TODO_API_URL || 'http://localhost:3002';

// Custom error class for API errors
export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Type for API error responses from backend
interface ApiErrorResponse {
  success?: boolean;
  error?:
    | {
        message?: string;
        code?: number;
      }
    | string;
  message?: string;
}

// Helper to extract error message from various response formats
function extractErrorMessage(data: ApiErrorResponse | undefined): string {
  if (!data) return 'Something went wrong';

  if (data.error && typeof data.error === 'object' && data.error.message) {
    return data.error.message;
  }

  if (typeof data.error === 'string') {
    return data.error;
  }

  if (data.message) {
    return data.message;
  }

  return 'Something went wrong';
}

// ── Token-refresh state ───────────────────────────────────────────────────────
// Shared across both axios instances so only one refresh call goes out at a time.

type QueueEntry = { resolve: () => void; reject: (err: unknown) => void };

let isRefreshing = false;
let failedQueue: QueueEntry[] = [];

function processQueue(error: unknown) {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve()
  );
  failedQueue = [];
}

// ── Axios instances ───────────────────────────────────────────────────────────

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Axios instance for the todo service (port 3002)
export const todoApi = axios.create({
  baseURL: TODO_API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ── Shared interceptor factory ────────────────────────────────────────────────
//
// On 401:
//   1. If the failed request IS the refresh endpoint → redirect to /login (expired session).
//   2. Otherwise, attempt POST /auth/refresh once.
//      • Success → retry the original request transparently.
//      • Failure  → redirect to /login.
// Concurrent 401s queue up and all retry after a single refresh call.

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

function attachRefreshInterceptor(instance: AxiosInstance) {
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiErrorResponse>) => {
      const originalRequest = error.config as RetryConfig | undefined;
      const status = error.response?.status ?? 500;

      if (
        status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !originalRequest.url?.includes('/auth/refresh')
      ) {
        if (isRefreshing) {
          // Another refresh is already in-flight — queue this request.
          return new Promise<unknown>((resolve, reject) => {
            failedQueue.push({
              resolve: () => resolve(instance(originalRequest)),
              reject,
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Always call the auth-service for the refresh, regardless of which
          // instance triggered the 401.
          await api.post('/auth/refresh');
          processQueue(null);
          return instance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError);
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      const message = extractErrorMessage(error.response?.data);
      const data = error.response?.data;
      throw new ApiError(status, message, data);
    }
  );
}

attachRefreshInterceptor(api);
attachRefreshInterceptor(todoApi);
