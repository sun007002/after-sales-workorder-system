/**
 * JWT authentication middleware.
 * Verifies the Bearer token and injects user context into req.user.
 */
import { NextFunction, Response } from 'express';
import { verifyToken } from '../utils/jwt';
import prisma from '../utils/prisma';
import { sendError } from '../utils/apiResponse';
import { AuthenticatedRequest, AuthUser } from '../types';

/**
 * Middleware that authenticates requests via JWT.
 * Expects `Authorization: Bearer <token>` header.
 * On success, attaches user info to req.user.
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, '未授权，请先登录', 401);
    return;
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    sendError(res, 'Token无效或已过期，请重新登录', 401);
    return;
  }

  // Fetch user with role to get permissions and display name.
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { role: true },
  });

  if (!user || user.status !== 'active') {
    sendError(res, '用户不存在或已被禁用', 401);
    return;
  }

  const authUser: AuthUser = {
    userId: user.id,
    roleId: user.roleId,
    username: user.username,
    displayName: user.displayName,
    permissions: (user.role.permissions as string[]) || [],
  };

  req.user = authUser;
  next();
}
