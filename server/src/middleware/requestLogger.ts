/**
 * Request logging middleware.
 * Logs incoming HTTP requests with method, path, and response time.
 */
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware that logs each request's method, path, status, and duration.
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const startTime = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;
    const statusEmoji = statusCode >= 400 ? '⚠' : '✓';
    console.log(
      `${statusEmoji} ${method} ${originalUrl} ${statusCode} ${duration}ms`,
    );
  });

  next();
}
