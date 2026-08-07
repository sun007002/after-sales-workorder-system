/**
 * Permission hook.
 * Provides permission checking utilities for conditional rendering.
 *
 * 重要：所有返回的函数都用 useCallback 稳定引用，依赖项为 permissions（来自 zustand，
 * 仅在权限变化时才变）。否则每次渲染 hasPermission 都是新函数，会导致依赖它的
 * useCallback/useEffect 无限触发（曾导致仪表盘疯狂调用 dashboard API、浏览器资源耗尽）。
 */
import { useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

/**
 * Hook for permission checking.
 * Returns helper functions to check if the current user has specific permissions.
 */
export function usePermission() {
  const permissions = useAuthStore((state) => state.permissions);

  /** Checks if the user has a specific permission code. */
  const hasPermission = useCallback(
    (code: string): boolean => {
      return permissions.includes(code);
    },
    [permissions],
  );

  /** Checks if the user has ALL of the specified permission codes. */
  const hasAllPermissions = useCallback(
    (codes: string[]): boolean => {
      return codes.every((code) => permissions.includes(code));
    },
    [permissions],
  );

  /** Checks if the user has ANY of the specified permission codes. */
  const hasAnyPermission = useCallback(
    (codes: string[]): boolean => {
      return codes.some((code) => permissions.includes(code));
    },
    [permissions],
  );

  /** Checks if the user is an engineer (after-sales staff role). */
  const isEngineer = useCallback((): boolean => {
    return (
      hasPermission('workorder:create') &&
      hasPermission('workorder:update') &&
      !hasPermission('workorder:delete') &&
      !hasPermission('user:manage') &&
      !hasPermission('payment:manage') &&
      !hasPermission('staff:manage') &&
      !hasPermission('customer:manage') &&
      !hasPermission('staff:read') &&
      !hasPermission('customer:read')
    );
  }, [hasPermission]);

  return {
    permissions,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    isEngineer,
  };
}
