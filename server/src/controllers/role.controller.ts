/**
 * Role management controller.
 * Handles role CRUD endpoints.
 */
import { Response } from 'express';
import { sendSuccess, AppError } from '../utils/apiResponse';
import * as roleService from '../services/role.service';
import { AuthenticatedRequest } from '../types';

/**
 * GET /api/roles
 * Retrieves all roles.
 */
export async function getRoleList(
  _req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const roles = await roleService.getRoleList();
  sendSuccess(res, roles);
}

/**
 * POST /api/roles
 * Creates a new role.
 */
export async function createRole(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const role = await roleService.createRole(req.body);
  sendSuccess(res, role, '角色创建成功', 201);
}

/**
 * PUT /api/roles/:id
 * Updates a role.
 */
export async function updateRole(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) throw new AppError('无效的ID', 400);

  const role = await roleService.updateRole(id, req.body);
  sendSuccess(res, role, '角色更新成功');
}

/**
 * DELETE /api/roles/:id
 * Deletes a role.
 */
export async function deleteRole(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) throw new AppError('无效的ID', 400);

  await roleService.deleteRole(id);
  sendSuccess(res, undefined, '角色删除成功');
}
