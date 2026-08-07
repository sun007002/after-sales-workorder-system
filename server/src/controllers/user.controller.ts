/**
 * User management controller.
 * Handles user CRUD, status toggle, and password reset endpoints.
 */
import { Response } from 'express';
import { sendSuccess, AppError } from '../utils/apiResponse';
import * as userService from '../services/user.service';
import { AuthenticatedRequest } from '../types';

/**
 * GET /api/users
 * Retrieves all users.
 */
export async function getUserList(
  _req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const users = await userService.getUserList();
  sendSuccess(res, users);
}

/**
 * POST /api/users
 * Creates a new user.
 */
export async function createUser(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const user = await userService.createUser(req.body);
  sendSuccess(res, user, '用户创建成功', 201);
}

/**
 * PUT /api/users/:id
 * Updates a user.
 */
export async function updateUser(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) throw new AppError('无效的ID', 400);

  const user = await userService.updateUser(id, req.body);
  sendSuccess(res, user, '用户更新成功');
}

/**
 * DELETE /api/users/:id
 * Deletes a user.
 */
export async function deleteUser(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user) throw new AppError('未授权', 401);

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) throw new AppError('无效的ID', 400);

  await userService.deleteUser(id, req.user.userId);
  sendSuccess(res, undefined, '用户删除成功');
}

/**
 * PATCH /api/users/:id/status
 * Toggles user status (active/disabled).
 */
export async function toggleUserStatus(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) throw new AppError('无效的ID', 400);

  const user = await userService.toggleUserStatus(id);
  sendSuccess(res, user, '状态更新成功');
}

/**
 * PUT /api/users/:id/reset-password
 * Resets a user's password.
 */
export async function resetPassword(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) throw new AppError('无效的ID', 400);

  const { newPassword } = req.body;
  if (!newPassword) throw new AppError('请输入新密码', 400);

  const user = await userService.resetPassword(id, newPassword);
  sendSuccess(res, user, '密码重置成功');
}
