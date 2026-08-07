/**
 * Work order file service.
 * Handles file upload, list, download, and deletion for work order attachments.
 */
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../utils/prisma';
import { AppError } from '../utils/apiResponse';
import config from '../config';
import { AuthUser, WorkOrderFileDTO } from '../types';

/** Max files per work order. */
const MAX_FILES_PER_ORDER = config.upload.maxFilesPerOrder;

/**
 * Converts a Prisma WorkOrderFile entity (with uploader relation) to a WorkOrderFileDTO.
 */
function toFileDTO(
  file: {
    id: number;
    workOrderId: number;
    fileName: string;
    originalName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
    uploadedBy: number;
    createdAt: Date;
    uploader: { id: number; displayName: string };
  },
): WorkOrderFileDTO {
  return {
    id: file.id,
    workOrderId: file.workOrderId,
    fileName: file.fileName,
    originalName: file.originalName,
    filePath: file.filePath,
    fileType: file.fileType,
    fileSize: file.fileSize,
    uploadedBy: file.uploadedBy,
    uploadedByName: file.uploader.displayName,
    createdAt: file.createdAt.toISOString(),
  };
}

/** Common include for file queries. */
const FILE_INCLUDE = {
  uploader: { select: { id: true, displayName: true } },
} as const;

/**
 * Uploads a file to a specific work order.
 * @param workOrderId - The work order ID.
 * @param file - The multer file object.
 * @param authUser - The authenticated user (uploader).
 * @returns The created file DTO.
 * @throws AppError if work order not found, file count exceeded, type not allowed, or size exceeded.
 */
export async function uploadFile(
  workOrderId: number,
  file: Express.Multer.File,
  authUser: AuthUser,
): Promise<WorkOrderFileDTO> {
  // Validate work order, file count, type, and size before moving the temp file.
  try {
    // Verify work order exists.
    const workOrder = await prisma.workOrder.findFirst({
      where: { id: workOrderId, isDeleted: false },
    });
    if (!workOrder) {
      throw new AppError('工单不存在', 404);
    }

    // Check file count limit.
    const existingCount = await prisma.workOrderFile.count({
      where: { workOrderId },
    });
    if (existingCount >= MAX_FILES_PER_ORDER) {
      throw new AppError(`每个工单最多上传${MAX_FILES_PER_ORDER}个文件`, 400);
    }

    // Validate file type.
    if (!config.upload.allowedTypes.includes(file.mimetype)) {
      throw new AppError(`不支持的文件类型: ${file.mimetype}`, 400);
    }

    // Validate file size.
    if (file.size > config.upload.maxFileSize) {
      throw new AppError('文件大小不能超过10MB', 400);
    }
  } catch (e) {
    // Clean up the temp file uploaded by multer before rethrowing.
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw e;
  }

  // Generate unique filename with original extension.
  // multer decodes filenames as latin1 by default, causing garbled UTF-8 CJK names;
  // re-decode to UTF-8 before use.
  const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
  const originalExt = path.extname(originalName);
  const uniqueName = `${uuidv4()}${originalExt}`;

  // Build target directory: uploads/work_orders/{workOrderId}/
  const targetDir = path.resolve(
    config.upload.dir,
    'work_orders',
    String(workOrderId),
  );

  // Ensure directory exists.
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Build target file path.
  const targetPath = path.join(targetDir, uniqueName);

  // Move the uploaded temp file to the target path.
  fs.renameSync(file.path, targetPath);

  // Relative path for storage (used for static file serving).
  const relativePath = `work_orders/${workOrderId}/${uniqueName}`;

  // Create database record.
  const fileRecord = await prisma.workOrderFile.create({
    data: {
      workOrderId,
      fileName: uniqueName,
      originalName: originalName,
      filePath: relativePath,
      fileType: file.mimetype,
      fileSize: file.size,
      uploadedBy: authUser.userId,
    },
    include: FILE_INCLUDE,
  });

  return toFileDTO(fileRecord);
}

/**
 * Retrieves all files for a work order.
 * @param workOrderId - The work order ID.
 * @returns Array of file DTOs.
 * @throws AppError if work order not found.
 */
export async function getFiles(workOrderId: number): Promise<WorkOrderFileDTO[]> {
  // Verify work order exists.
  const workOrder = await prisma.workOrder.findFirst({
    where: { id: workOrderId, isDeleted: false },
  });
  if (!workOrder) {
    throw new AppError('工单不存在', 404);
  }

  const files = await prisma.workOrderFile.findMany({
    where: { workOrderId },
    include: FILE_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });

  return files.map(toFileDTO);
}

/**
 * Gets the physical file path for download.
 * @param workOrderId - The work order ID.
 * @param fileId - The file ID.
 * @returns Object with filePath and originalName for download.
 * @throws AppError if work order or file not found.
 */
export async function downloadFile(
  workOrderId: number,
  fileId: number,
): Promise<{ filePath: string; originalName: string; fileType: string }> {
  // Verify work order exists.
  const workOrder = await prisma.workOrder.findFirst({
    where: { id: workOrderId, isDeleted: false },
  });
  if (!workOrder) {
    throw new AppError('工单不存在', 404);
  }

  const fileRecord = await prisma.workOrderFile.findFirst({
    where: { id: fileId, workOrderId },
  });
  if (!fileRecord) {
    throw new AppError('文件不存在', 404);
  }

  const absolutePath = path.resolve(config.upload.dir, fileRecord.filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new AppError('文件不存在或已被删除', 404);
  }

  return {
    filePath: absolutePath,
    originalName: fileRecord.originalName,
    fileType: fileRecord.fileType,
  };
}

/**
 * Deletes a file (database record + physical file).
 * @param workOrderId - The work order ID.
 * @param fileId - The file ID.
 * @throws AppError if work order or file not found.
 */
export async function deleteFile(
  workOrderId: number,
  fileId: number,
): Promise<void> {
  // Verify work order exists.
  const workOrder = await prisma.workOrder.findFirst({
    where: { id: workOrderId, isDeleted: false },
  });
  if (!workOrder) {
    throw new AppError('工单不存在', 404);
  }

  const fileRecord = await prisma.workOrderFile.findFirst({
    where: { id: fileId, workOrderId },
  });
  if (!fileRecord) {
    throw new AppError('文件不存在', 404);
  }

  // Delete physical file.
  const absolutePath = path.resolve(config.upload.dir, fileRecord.filePath);
  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }

  // Delete database record.
  await prisma.workOrderFile.delete({
    where: { id: fileId },
  });
}
