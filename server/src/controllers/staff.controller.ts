/**
 * Staff controller.
 * Handles after-sales staff CRUD endpoints.
 */
import { Response } from 'express';
import { sendSuccess, AppError } from '../utils/apiResponse';
import * as staffService from '../services/staff.service';
import { AuthenticatedRequest } from '../types';

/**
 * GET /api/staff
 * Retrieves all after-sales staff.
 */
export async function getStaffList(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const status = req.query.status as string | undefined;
  const staffList = await staffService.getStaffList(status);
  sendSuccess(res, staffList);
}

/**
 * POST /api/staff
 * Creates a new after-sales staff member.
 */
export async function createStaff(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const staff = await staffService.createStaff(req.body);
  sendSuccess(res, staff, '售后人员创建成功', 201);
}

/**
 * PUT /api/staff/:id
 * Updates an after-sales staff member.
 */
export async function updateStaff(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) throw new AppError('无效的ID', 400);

  const staff = await staffService.updateStaff(id, req.body);
  sendSuccess(res, staff, '售后人员更新成功');
}

/**
 * DELETE /api/staff/:id
 * Deletes an after-sales staff member.
 */
export async function deleteStaff(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) throw new AppError('无效的ID', 400);

  await staffService.deleteStaff(id);
  sendSuccess(res, undefined, '售后人员删除成功');
}

/**
 * PATCH /api/staff/:id/status
 * Toggles the status of an after-sales staff member.
 */
export async function toggleStaffStatus(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) throw new AppError('无效的ID', 400);

  const staff = await staffService.toggleStaffStatus(id);
  sendSuccess(res, staff, '状态更新成功');
}
