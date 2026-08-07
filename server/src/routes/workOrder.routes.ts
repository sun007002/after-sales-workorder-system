/**
 * Work order routes.
 * GET    /api/work-orders          - List (workorder:read)
 * GET    /api/work-orders/:id      - Detail (workorder:read)
 * POST   /api/work-orders          - Create (workorder:create)
 * PUT    /api/work-orders/:id      - Update (workorder:update)
 * DELETE /api/work-orders/:id      - Delete (workorder:delete)
 * PATCH  /api/work-orders/:id/payment - Update payment (payment:manage)
 * GET    /api/work-orders/recent   - Recent orders (workorder:read)
 *
 * File sub-routes (FEAT-3):
 * POST   /api/work-orders/:id/files             - Upload file (workorder:update)
 * GET    /api/work-orders/:id/files             - List files (workorder:read)
 * GET    /api/work-orders/:id/files/:fileId/download - Download file (workorder:read)
 * DELETE /api/work-orders/:id/files/:fileId     - Delete file (workorder:update)
 */
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import config from '../config';
import { AppError } from '../utils/apiResponse';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import * as workOrderController from '../controllers/workOrder.controller';
import * as workOrderFileController from '../controllers/workOrderFile.controller';

const router = Router();

// Multer config: disk storage with temp dir, UUID handled in service.
const uploadDir = path.resolve(config.upload.dir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const multerStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const tmpDir = path.join(uploadDir, 'temp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    cb(null, tmpDir);
  },
  filename: (_req, file, cb) => {
    // Use a temp name; service will rename with UUID.
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
  fileFilter: (_req, file, cb) => {
    if (config.upload.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      // Use AppError so the global error handler returns 400 instead of 500.
      cb(new AppError('不支持的文件类型', 400));
    }
  },
});

// All work order routes require authentication.
router.use(authMiddleware);

// Recent work orders (must be before /:id to avoid route conflict).
router.get('/recent', requirePermission('workorder:read'), workOrderController.getRecentWorkOrders);

// List and create.
router.get('/', requirePermission('workorder:read'), workOrderController.getWorkOrders);
router.post('/', requirePermission('workorder:create'), workOrderController.createWorkOrder);

// Detail, update, delete.
router.get('/:id', requirePermission('workorder:read'), workOrderController.getWorkOrderById);
router.put('/:id', requirePermission('workorder:update'), workOrderController.updateWorkOrder);
router.delete('/:id', requirePermission('workorder:delete'), workOrderController.deleteWorkOrder);

// Payment status update.
router.patch('/:id/payment', requirePermission('payment:manage'), workOrderController.updatePaymentStatus);

// File sub-routes (FEAT-3).
router.post(
  '/:id/files',
  requirePermission('workorder:update'),
  upload.single('file'),
  workOrderFileController.uploadFile,
);
router.get(
  '/:id/files',
  requirePermission('workorder:read'),
  workOrderFileController.getFiles,
);
router.get(
  '/:id/files/:fileId/download',
  requirePermission('workorder:read'),
  workOrderFileController.downloadFile,
);
router.delete(
  '/:id/files/:fileId',
  requirePermission('workorder:update'),
  workOrderFileController.deleteFile,
);

export default router;
