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
  error?: string;
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

// Response interceptor - handle errors globally
api.interceptors.response.use(
  // Success - just return the response
  (response) => response,

  // Error - transform to ApiError
  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status ?? 500;
    const message =
      error.response?.data?.error ??
      error.response?.data?.message ??
      'Something went wrong';
    const data = error.response?.data;

    throw new ApiError(status, message, data);
  }
);
