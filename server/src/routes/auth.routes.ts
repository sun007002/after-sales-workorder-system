/**
 * Authentication routes.
 * POST /api/auth/login - User login (public)
 * POST /api/auth/logout - User logout (authenticated)
 * GET  /api/auth/me - Get current user (authenticated)
 * PUT  /api/auth/change-password - Change password (authenticated)
 */
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as authController from '../controllers/auth.controller';

const router = Router();

// Public route - no auth required.
router.post('/login', authController.login);

// Authenticated routes.
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.getMe);
router.put('/change-password', authMiddleware, authController.changePassword);

export default router;
