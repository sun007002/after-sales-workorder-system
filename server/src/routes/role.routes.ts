/**
 * Role management routes.
 * GET    /api/roles     - List (role:manage)
 * POST   /api/roles     - Create (role:manage)
 * PUT    /api/roles/:id - Update (role:manage)
 * DELETE /api/roles/:id - Delete (role:manage)
 */
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import * as roleController from '../controllers/role.controller';

const router = Router();

// All role routes require authentication.
router.use(authMiddleware);

router.get('/', requirePermission('role:manage'), roleController.getRoleList);
router.post('/', requirePermission('role:manage'), roleController.createRole);
router.put('/:id', requirePermission('role:manage'), roleController.updateRole);
router.delete('/:id', requirePermission('role:manage'), roleController.deleteRole);

export default router;
