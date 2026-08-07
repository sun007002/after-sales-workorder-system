/**
 * Unified API response helpers.
 * All API endpoints return a consistent JSON structure.
 */
import { Response } from 'express';

/** Standard success response structure. */
interface ApiResponse<T> {
  code: number;
  data?: T;
  message: string;
}

/** Paginated response data structure. */
interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Sends a success response with optional data and message.
 * @param res - Express response object.
 * @param data - The data to return.
 * @param message - Success message (default: "success").
 * @param statusCode - HTTP status code (default: 200).
 */
export function sendSuccess<T>(
  res: Response,
  data?: T,
  message: string = 'success',
  statusCode: number = 200,
): Response {
  const response: ApiResponse<T> = {
    code: statusCode,
    data,
    message,
  };
  return res.status(statusCode).json(response);
}

/**
 * Sends a paginated list response.
 * @param res - Express response object.
 * @param items - Array of data items.
 * @param total - Total record count.
 * @param page - Current page number (1-based).
 * @param pageSize - Items per page.
 */
export function sendPaginated<T>(
  res: Response,
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): Response {
  const response: ApiResponse<PaginatedData<T>> = {
    code: 200,
    data: { items, total, page, pageSize },
    message: 'success',
  };
  return res.status(200).json(response);
}

/**
 * Sends an error response.
 * @param res - Express response object.
 * @param message - Error message.
 * @param code - Error code (default: 400).
 * @param errors - Optional field-level validation errors.
 */
export function sendError(
  res: Response,
  message: string,
  code: number = 400,
  errors?: object[],
): Response {
  const response: ApiResponse<never> = {
    code,
    message,
  };
  if (errors) {
    (response as unknown as { errors: object[] }).errors = errors;
  }
  return res.status(code >= 100 && code < 600 ? code : 500).json(response);
}

/** Custom application error class for business logic errors. */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: number;
  public readonly errors?: object[];

  constructor(
    message: string,
    statusCode: number = 400,
    errors?: object[],
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = statusCode;
    this.errors = errors;
  }
}
