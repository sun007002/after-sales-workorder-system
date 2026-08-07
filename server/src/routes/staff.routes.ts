/**
 * Staff routes.
 * GET    /api/staff          - List (staff:read)
 * POST   /api/staff          - Create (staff:manage)
 * PUT    /api/staff/:id      - Update (staff:manage)
 * DELETE /api/staff/:id      - Delete (staff:manage)
 * PATCH  /api/staff/:id/status - Toggle status (staff:manage)
 */
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import * as staffController from '../controllers/staff.controller';

const router = Router();

// All staff routes require authentication.
router.use(authMiddleware);

router.get('/', requirePermission('staff:read'), staffController.getStaffList);
router.post('/', requirePermission('staff:manage'), staffController.createStaff);
router.put('/:id', requirePermission('staff:manage'), staffController.updateStaff);
router.delete('/:id', requirePermission('staff:manage'), staffController.deleteStaff);
router.patch('/:id/status', requirePermission('staff:manage'), staffController.toggleStaffStatus);

export default router;
