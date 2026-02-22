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

// What the backend actually returns: { success, data: { user } }
type RawAuthResponse = {
  success: boolean;
  data: { user: User };
};

// What our service functions expose to callers: { success, user }
export type AuthResponse = {
  success: boolean;
  user: User;
};

// --- API Functions ---

export async function signup(data: {
  email: string;
  password: string;
  fullName: string;
}): Promise<AuthResponse> {
  const response = await api.post<RawAuthResponse>('/auth/signup', data);
  return { success: response.data.success, user: response.data.data.user };
}

export async function login(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const response = await api.post<RawAuthResponse>('/auth/login', data);
  return { success: response.data.success, user: response.data.data.user };
}

export async function logout() {
  const response = await api.post<{ success: boolean }>('/auth/logout');
  return response.data;
}

export async function getCurrentUser(): Promise<AuthResponse> {
  const response = await api.get<RawAuthResponse>('/auth/me');
  return { success: response.data.success, user: response.data.data.user };
}

export async function refreshToken() {
  const response = await api.post<{ success: boolean }>('/auth/refresh');
  return response.data;
}
