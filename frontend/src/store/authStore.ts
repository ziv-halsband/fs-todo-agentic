import { create } from 'zustand';
import { getCurrentUser, logout as logoutApi } from '../services/authService';
import type { User } from '../services/authService';

// Store state shape
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User) => void;
  clearUser: () => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: true, // True until we check if user is logged in

  // Action: Set user after login/signup
  setUser: (user) =>
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
    }),

  // Action: Clear user on logout
  clearUser: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }),

  // Action: Check if user is already logged in (on app load)
  checkAuth: async () => {
    try {
      const response = await getCurrentUser();
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      // Not logged in or token expired
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  // Action: Logout
  logout: async () => {
    try {
      await logoutApi();
    } finally {
      // Clear state regardless of API success
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
