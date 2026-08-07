/**
 * Work order controller.
 * Handles CRUD and payment status endpoints for work orders.
 */
import { Response } from 'express';
import { sendSuccess, sendPaginated, AppError } from '../utils/apiResponse';
import * as workOrderService from '../services/workOrder.service';
import { AuthenticatedRequest, WorkOrderQuery } from '../types';

/**
 * GET /api/work-orders
 * Retrieves a paginated list of work orders with filtering.
 */
export async function getWorkOrders(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user) throw new AppError('未授权', 401);

  const query = req.query as unknown as WorkOrderQuery;
  const result = await workOrderService.getWorkOrders(query, req.user);
  sendPaginated(res, result.items, result.total, result.page, result.pageSize);
}

/**
 * GET /api/work-orders/:id
 * Retrieves a single work order by ID.
 */
export async function getWorkOrderById(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user) throw new AppError('未授权', 401);

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) throw new AppError('无效的工单ID', 400);

  const workOrder = await workOrderService.getWorkOrderById(id, req.user);
  sendSuccess(res, workOrder);
}

/**
 * POST /api/work-orders
 * Creates a new work order.
 */
export async function createWorkOrder(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user) throw new AppError('未授权', 401);

  const workOrder = await workOrderService.createWorkOrder(req.body, req.user);
  sendSuccess(res, workOrder, '工单创建成功', 201);
}

/**
 * PUT /api/work-orders/:id
 * Updates an existing work order.
 */
export async function updateWorkOrder(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user) throw new AppError('未授权', 401);

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) throw new AppError('无效的工单ID', 400);

  const workOrder = await workOrderService.updateWorkOrder(id, req.body, req.user);
  sendSuccess(res, workOrder, '工单更新成功');
}

/**
 * DELETE /api/work-orders/:id
 * Soft-deletes a work order.
 */
export async function deleteWorkOrder(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) throw new AppError('无效的工单ID', 400);

  await workOrderService.deleteWorkOrder(id);
  sendSuccess(res, undefined, '工单删除成功');
}

/**
 * PATCH /api/work-orders/:id/payment
 * Updates the payment status of a work order.
 */
export async function updatePaymentStatus(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user) throw new AppError('未授权', 401);

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) throw new AppError('无效的工单ID', 400);

  const { isPaid } = req.body;
  if (typeof isPaid !== 'boolean') {
    throw new AppError('请提供有效的结款状态', 400);
  }

  const workOrder = await workOrderService.updatePaymentStatus(id, isPaid, req.user);
  sendSuccess(res, workOrder, '结款状态更新成功');
}

/**
 * GET /api/work-orders/recent
 * Retrieves the most recent work orders (for dashboard).
 */
export async function getRecentWorkOrders(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user) throw new AppError('未授权', 401);

  const limit = parseInt((req.query.limit as string) || '5', 10);
  const workOrders = await workOrderService.getRecentWorkOrders(limit, req.user);
  sendSuccess(res, workOrders);
}
