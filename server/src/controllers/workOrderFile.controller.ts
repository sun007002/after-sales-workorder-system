/**
 * Work order file controller.
 * Handles upload, list, download, and delete endpoints for work order files.
 */
import { Response } from 'express';
import { sendSuccess, AppError } from '../utils/apiResponse';
import * as workOrderFileService from '../services/workOrderFile.service';
import { AuthenticatedRequest } from '../types';

/**
 * POST /api/work-orders/:id/files
 * Uploads a file to a work order (multipart/form-data, field: "file").
 */
export async function uploadFile(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user) throw new AppError('未授权', 401);

  const workOrderId = parseInt(req.params.id, 10);
  if (isNaN(workOrderId)) {
    throw new AppError('无效的工单ID', 400);
  }

  if (!req.file) {
    throw new AppError('请选择要上传的文件', 400);
  }

  const fileDTO = await workOrderFileService.uploadFile(workOrderId, req.file, req.user);
  sendSuccess(res, fileDTO, '文件上传成功', 201);
}

/**
 * GET /api/work-orders/:id/files
 * Retrieves the file list for a work order.
 */
export async function getFiles(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user) throw new AppError('未授权', 401);

  const workOrderId = parseInt(req.params.id, 10);
  if (isNaN(workOrderId)) {
    throw new AppError('无效的工单ID', 400);
  }

  const files = await workOrderFileService.getFiles(workOrderId);
  sendSuccess(res, files);
}

/**
 * GET /api/work-orders/:id/files/:fileId/download
 * Downloads a specific file (streams the file as attachment).
 */
export async function downloadFile(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user) throw new AppError('未授权', 401);

  const workOrderId = parseInt(req.params.id, 10);
  const fileId = parseInt(req.params.fileId, 10);
  if (isNaN(workOrderId) || isNaN(fileId)) {
    throw new AppError('无效的ID', 400);
  }

  const { filePath, originalName, fileType } = await workOrderFileService.downloadFile(
    workOrderId,
    fileId,
  );

  // Set content type if available, fallback to octet-stream.
  if (fileType) {
    res.setHeader('Content-Type', fileType);
  }

  // Use RFC 5987 encoding for filename with non-ASCII characters.
  res.setHeader(
    'Content-Disposition',
    `attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`,
  );

  res.download(filePath, originalName, (err) => {
    if (err) {
      // If headers not yet sent, respond with error.
      if (!res.headersSent) {
        throw new AppError('文件下载失败', 500);
      }
    }
  });
}

/**
 * DELETE /api/work-orders/:id/files/:fileId
 * Deletes a specific file (database record + physical file).
 */
export async function deleteFile(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user) throw new AppError('未授权', 401);

  const workOrderId = parseInt(req.params.id, 10);
  const fileId = parseInt(req.params.fileId, 10);
  if (isNaN(workOrderId) || isNaN(fileId)) {
    throw new AppError('无效的ID', 400);
  }

  await workOrderFileService.deleteFile(workOrderId, fileId);
  res.status(204).send();
}
