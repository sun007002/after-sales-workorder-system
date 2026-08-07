/**
 * Summary query routes.
 * GET /api/summary/overview          - Overall summary (summary:view)
 * GET /api/summary/composite         - Composite query (summary:view)
 * GET /api/summary/composite/export  - Composite query Excel export (summary:view)
 * GET /api/summary/staff             - Staff summary (summary:view)
 * GET /api/summary/dashboard         - Dashboard chart data (summary:view)
 */
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import * as summaryController from '../controllers/summary.controller';

const router = Router();

// All summary routes require authentication.
router.use(authMiddleware);

router.get('/overview', requirePermission('summary:view'), summaryController.getOverview);
router.get('/composite', requirePermission('summary:view'), summaryController.getComposite);
router.get('/staff', requirePermission('summary:view'), summaryController.getStaffSummary);
router.get('/dashboard', requirePermission('summary:view'), summaryController.getDashboard);
router.get('/composite/export', requirePermission('summary:view'), summaryController.exportComposite);

export default router;
