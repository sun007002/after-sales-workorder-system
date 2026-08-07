/**
 * Customer routes.
 * GET    /api/customers                          - List (customer:read)
 * POST   /api/customers                          - Create (customer:manage)
 * PUT    /api/customers/:id                      - Update (customer:manage)
 * DELETE /api/customers/:id                      - Delete (customer:manage)
 * GET    /api/customers/:id/contacts             - List contacts (customer:read)
 * POST   /api/customers/:id/contacts             - Create contact (customer:manage)
 * PUT    /api/customers/:id/contacts/:contactId  - Update contact (customer:manage)
 * DELETE /api/customers/:id/contacts/:contactId  - Delete contact (customer:manage)
 */
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import * as customerController from '../controllers/customer.controller';

const router = Router();

// All customer routes require authentication.
router.use(authMiddleware);

// Customer CRUD.
router.get('/', requirePermission('customer:read'), customerController.getCustomerList);
router.post('/', requirePermission('customer:manage'), customerController.createCustomer);
router.put('/:id', requirePermission('customer:manage'), customerController.updateCustomer);
router.delete('/:id', requirePermission('customer:manage'), customerController.deleteCustomer);

// Contact CRUD (nested under customer).
router.get('/:id/contacts', requirePermission('customer:read'), customerController.getContacts);
router.post('/:id/contacts', requirePermission('customer:manage'), customerController.createContact);
router.put('/:id/contacts/:contactId', requirePermission('customer:manage'), customerController.updateContact);
router.delete('/:id/contacts/:contactId', requirePermission('customer:manage'), customerController.deleteContact);

export default router;
