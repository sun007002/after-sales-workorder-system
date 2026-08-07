/**
 * RBAC (Role-Based Access Control) middleware.
 * Checks if the authenticated user has the required permission code.
 */
import { NextFunction, Response } from 'express';
import { sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';

/**
 * Creates an RBAC middleware that checks for a specific permission code.
 * @param requiredPermission - The permission code required to access the route.
 * @returns Express middleware function.
 */
export function requirePermission(requiredPermission: string) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void => {
    if (!req.user) {
      sendError(res, '未授权，请先登录', 401);
      return;
    }

    const userPermissions = req.user.permissions || [];
    if (!userPermissions.includes(requiredPermission)) {
      sendError(res, '权限不足，无法执行此操作', 403);
      return;
    }

    next();
  };
}

/**
 * Checks if the current user has a specific permission.
 * @param req - The authenticated request.
 * @param permission - The permission code to check.
 * @returns True if the user has the permission.
 */
export function hasPermission(
  req: AuthenticatedRequest,
  permission: string,
): boolean {
  if (!req.user) return false;
  return (req.user.permissions || []).includes(permission);
}

/**
 * Checks if the current user has the '售后人员' role by role name.
 * Used for data-level permission filtering.
 * @param req - The authenticated request.
 * @returns True if the user is an after-sales engineer.
 */
export function isEngineerRole(req: AuthenticatedRequest): boolean {
  if (!req.user) return false;
  // Engineer role: has workorder create/update but NO staff:read, customer:read,
  // workorder:delete, user/role/payment management.
  // This distinguishes from 售后主管 (Supervisor) who has staff:read + customer:read.
  const perms = req.user.permissions || [];
  return (
    perms.includes('workorder:create') &&
    perms.includes('workorder:update') &&
    !perms.includes('workorder:delete') &&
    !perms.includes('user:manage') &&
    !perms.includes('payment:manage') &&
    !perms.includes('staff:manage') &&
    !perms.includes('customer:manage') &&
    !perms.includes('staff:read') &&
    !perms.includes('customer:read')
  );
}
