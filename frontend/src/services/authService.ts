/**
 * authService.ts - Authentication API calls
 */

import { api } from './api';

// Types for API responses
export type User = {
  id: string;
  email: string;
  fullName: string;
  role: 'USER' | 'EDITOR' | 'ADMIN';
  avatarUrl: string | null;
  provider: 'EMAIL' | 'GOOGLE';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  success: boolean;
  user: User;
};

// --- API Functions ---

export async function signup(data: {
  email: string;
  password: string;
  fullName: string;
}) {
  const response = await api.post<AuthResponse>('/auth/signup', data);
  return response.data;
}

export async function login(data: { email: string; password: string }) {
  const response = await api.post<AuthResponse>('/auth/login', data);
  return response.data;
}

export async function logout() {
  const response = await api.post<{ success: boolean }>('/auth/logout');
  return response.data;
}

export async function getCurrentUser() {
  const response = await api.get<AuthResponse>('/auth/me');
  return response.data;
}

export async function refreshToken() {
  const response = await api.post<{ success: boolean }>('/auth/refresh');
  return response.data;
}
