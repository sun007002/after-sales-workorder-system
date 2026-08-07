/**
 * Route aggregation.
 * Combines all module routers under /api.
 */
import { Router } from 'express';
import authRoutes from './auth.routes';
import workOrderRoutes from './workOrder.routes';
import staffRoutes from './staff.routes';
import customerRoutes from './customer.routes';
import summaryRoutes from './summary.routes';
import userRoutes from './user.routes';
import roleRoutes from './role.routes';

const router = Router();

// Register all module routes under /api.
router.use('/auth', authRoutes);
router.use('/work-orders', workOrderRoutes);
router.use('/staff', staffRoutes);
router.use('/customers', customerRoutes);
router.use('/summary', summaryRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);

export default router;
