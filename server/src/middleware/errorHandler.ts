/**
 * Global error handling middleware.
 * Catches all errors thrown in the request pipeline and returns
 * a consistent JSON error response.
 */
import { NextFunction, Request, Response } from 'express';
import { AppError, sendError } from '../utils/apiResponse';
import multer from 'multer';
import { Prisma } from '@prisma/client';

/**
 * Express error handler middleware. Must have 4 arguments to be recognized
 * as an error handler by Express.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error('[ERROR]', err);

  // Multer upload errors (file size / count limits).
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      sendError(res, '文件大小不能超过10MB', 400);
      return;
    }
    sendError(res, `文件上传失败: ${err.message}`, 400);
    return;
  }

  // Application-level business errors.
  if (err instanceof AppError) {
    sendError(res, err.message, err.code, err.errors);
    return;
  }

  // Prisma known request errors.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        sendError(res, '数据重复，违反唯一约束', 409);
        return;
      case 'P2025':
        sendError(res, '记录不存在', 404);
        return;
      case 'P2003':
        sendError(res, '关联数据不存在，操作失败', 400);
        return;
      case 'P2000':
        sendError(res, '数据超出字段长度限制', 400);
        return;
      default:
        sendError(res, `数据库错误: ${err.code}`, 500);
        return;
    }
  }

  // Prisma validation errors.
  if (err instanceof Prisma.PrismaClientValidationError) {
    sendError(res, '数据验证失败', 400);
    return;
  }

  // Unknown errors.
  sendError(res, '服务器内部错误', 500);
}
