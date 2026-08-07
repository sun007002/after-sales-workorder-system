/**
 * 404 Not Found middleware.
 * Handles requests that don't match any defined routes.
 */
import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse';

/**
 * Middleware that catches all unmatched routes and returns a 404 response.
 */
export function notFoundHandler(
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  sendError(res, '接口不存在', 404);
}
