/**
 * api.ts - Base API configuration with Axios
 */

import axios, { AxiosError } from 'axios';

// Backend URL - from environment variable or default
const API_BASE_URL: string =
  import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send cookies with every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to extract error message from various response formats
function extractErrorMessage(data: ApiErrorResponse | undefined): string {
  if (!data) return 'Something went wrong';

  // If error is an object with message property
  if (data.error && typeof data.error === 'object' && data.error.message) {
    return data.error.message;
  }

  // If error is a string directly
  if (typeof data.error === 'string') {
    return data.error;
  }

  // Fallback to top-level message
  if (data.message) {
    return data.message;
  }

  return 'Something went wrong';
}

// Response interceptor - handle errors globally
api.interceptors.response.use(
  // Success - just return the response
  (response) => response,

  // Error - transform to ApiError
  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status ?? 500;
    const message = extractErrorMessage(error.response?.data);
    const data = error.response?.data;

    throw new ApiError(status, message, data);
  }
);
