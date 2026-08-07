/**
 * Authentication controller.
 * Handles login, logout, current user, and password change endpoints.
 */
import { Response } from 'express';
import { sendSuccess } from '../utils/apiResponse';
import * as authService from '../services/auth.service';
import { AuthenticatedRequest, LoginBody, ChangePasswordBody } from '../types';

/**
 * POST /api/auth/login
 * Authenticates user and returns JWT token.
 */
export async function login(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { username, password } = req.body as LoginBody;

  if (!username || !password) {
    sendSuccess(res, undefined, '用户名和密码不能为空', 400);
    return;
  }

  const result = await authService.login(username, password);
  sendSuccess(res, result, '登录成功');
}

/**
 * POST /api/auth/logout
 * Logs out the current user (client-side token removal).
 */
export async function logout(
  _req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  sendSuccess(res, undefined, '登出成功');
}

/**
 * GET /api/auth/me
 * Returns the current authenticated user's info and permissions.
 */
export async function getMe(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user) {
    sendSuccess(res, undefined, '未授权', 401);
    return;
  }

  const result = await authService.getCurrentUser(req.user);
  sendSuccess(res, result, 'success');
}

/**
 * PUT /api/auth/change-password
 * Changes the current user's password.
 */
export async function changePassword(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user) {
    sendSuccess(res, undefined, '未授权', 401);
    return;
  }

  const { oldPassword, newPassword } = req.body as ChangePasswordBody;

  if (!oldPassword || !newPassword) {
    sendSuccess(res, undefined, '请输入原密码和新密码', 400);
    return;
  }

  await authService.changePassword(req.user.userId, oldPassword, newPassword);
  sendSuccess(res, undefined, '密码修改成功');
}
