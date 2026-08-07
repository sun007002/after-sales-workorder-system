/**
 * Summary controller.
 * Handles overview, composite query, and staff summary endpoints.
 */
import { Response } from 'express';
import { sendSuccess, AppError } from '../utils/apiResponse';
import * as summaryService from '../services/summary.service';
import { AuthenticatedRequest, CompositeQuery } from '../types';

/**
 * GET /api/summary/overview
 * Retrieves the overall summary statistics.
 */
export async function getOverview(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user) throw new AppError('未授权', 401);

  const overview = await summaryService.getOverview(req.user);
  sendSuccess(res, overview);
}

/**
 * GET /api/summary/composite
 * Performs a composite query with multiple filters.
 */
export async function getComposite(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user) throw new AppError('未授权', 401);

  const query = req.query as unknown as CompositeQuery;
  const result = await summaryService.getComposite(query, req.user);
  sendSuccess(res, result);
}

/**
 * GET /api/summary/staff
 * Retrieves per-staff summary statistics.
 */
export async function getStaffSummary(
  _req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const staffSummary = await summaryService.getStaffSummary();
  sendSuccess(res, staffSummary);
}

/**
 * GET /api/summary/dashboard
 * Retrieves all dashboard chart data in a single request.
 */
export async function getDashboard(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user) throw new AppError('未授权', 401);

  const startDate =
    typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
  const endDate =
    typeof req.query.endDate === 'string' ? req.query.endDate : undefined;

  const dashboardData = await summaryService.getDashboardData(req.user, {
    startDate,
    endDate,
  });
  sendSuccess(res, dashboardData);
}

/**
 * GET /api/summary/composite/export
 * Exports the composite query result as an Excel (.xlsx) file.
 */
export async function exportComposite(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user) throw new AppError('未授权', 401);

  const query = req.query as unknown as CompositeQuery;
  const buffer = await summaryService.exportComposite(query, req.user);

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const filename = `composite_query_${yyyy}${mm}${dd}_${hh}${min}.xlsx`;

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(filename)}"`,
  );
  res.send(buffer);
}
