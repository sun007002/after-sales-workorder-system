/**
 * User management routes.
 * GET    /api/users                 - List (user:manage)
 * POST   /api/users                 - Create (user:manage)
 * PUT    /api/users/:id             - Update (user:manage)
 * DELETE /api/users/:id             - Delete (user:manage)
 * PATCH  /api/users/:id/status      - Toggle status (user:manage)
 * PUT    /api/users/:id/reset-password - Reset password (user:manage)
 */
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import * as userController from '../controllers/user.controller';

const router = Router();

// All user routes require authentication.
router.use(authMiddleware);

router.get('/', requirePermission('user:manage'), userController.getUserList);
router.post('/', requirePermission('user:manage'), userController.createUser);
router.put('/:id', requirePermission('user:manage'), userController.updateUser);
router.delete('/:id', requirePermission('user:manage'), userController.deleteUser);
router.patch('/:id/status', requirePermission('user:manage'), userController.toggleUserStatus);
router.put('/:id/reset-password', requirePermission('user:manage'), userController.resetPassword);

export default router;
