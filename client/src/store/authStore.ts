/**
 * Authentication state store using Zustand.
 * Manages token, user, and permissions with localStorage persistence.
 */
import { create } from 'zustand';
import type { User } from '../types';

/** Auth store state interface. */
interface AuthState {
  token: string | null;
  user: User | null;
  permissions: string[];
  isAuthenticated: boolean;
  setAuth: (token: string, user: User, permissions: string[]) => void;
  setPermissions: (permissions: string[]) => void;
  clearAuth: () => void;
  hasPermission: (code: string) => boolean;
}

/**
 * Zustand store for authentication state.
 * Persists token, user, and permissions to localStorage.
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  user: (() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) as User : null;
  })(),
  permissions: (() => {
    const stored = localStorage.getItem('permissions');
    return stored ? JSON.parse(stored) as string[] : [];
  })(),
  isAuthenticated: !!localStorage.getItem('token'),

  setAuth: (token: string, user: User, permissions: string[]) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('permissions', JSON.stringify(permissions));
    set({ token, user, permissions, isAuthenticated: true });
  },

  setPermissions: (permissions: string[]) => {
    localStorage.setItem('permissions', JSON.stringify(permissions));
    set({ permissions });
  },

  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
    set({ token: null, user: null, permissions: [], isAuthenticated: false });
  },

  hasPermission: (code: string) => {
    const { permissions } = get();
    return permissions.includes(code);
  },
}));
