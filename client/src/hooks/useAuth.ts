/**
 * Authentication hook.
 * Provides convenient access to auth state and actions.
 */
import { useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import * as authApi from '../api/auth.api';
import type { LoginResult } from '../types';

/**
 * Hook for authentication operations.
 * Returns current user state and login/logout/changePassword functions.
 */
export function useAuth() {
  const { token, user, permissions, isAuthenticated, setAuth, clearAuth, hasPermission } =
    useAuthStore();

  /**
   * Logs in with username and password.
   * Stores token and user info, then fetches permissions.
   */
  const login = useCallback(
    async (username: string, password: string): Promise<LoginResult> => {
      const result = await authApi.login(username, password);

      // Store token first so that getMe() request includes the Authorization header.
      localStorage.setItem('token', result.token);

      // Fetch permissions after login.
      const me = await authApi.getMe();
      setAuth(result.token, result.user, me.permissions);

      return result;
    },
    [setAuth],
  );

  /** Logs out and clears auth state. */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout API errors.
    }
    clearAuth();
  }, [clearAuth]);

  /** Changes the current user's password. */
  const changePassword = useCallback(
    async (oldPassword: string, newPassword: string): Promise<void> => {
      await authApi.changePassword(oldPassword, newPassword);
    },
    [],
  );

  return {
    token,
    user,
    permissions,
    isAuthenticated,
    login,
    logout,
    changePassword,
    hasPermission,
  };
}
