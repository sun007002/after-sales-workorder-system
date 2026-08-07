/**
 * Customer controller.
 * Handles customer CRUD and contact management endpoints.
 */
import { Response } from 'express';
import { sendSuccess, AppError } from '../utils/apiResponse';
import * as customerService from '../services/customer.service';
import { AuthenticatedRequest } from '../types';

// ============ Customer endpoints ============

/**
 * GET /api/customers
 * Retrieves all customers.
 */
export async function getCustomerList(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const status = req.query.status as string | undefined;
  const customers = await customerService.getCustomerList(status);
  sendSuccess(res, customers);
}

/**
 * POST /api/customers
 * Creates a new customer.
 */
export async function createCustomer(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const customer = await customerService.createCustomer(req.body);
  sendSuccess(res, customer, '客户创建成功', 201);
}

/**
 * PUT /api/customers/:id
 * Updates a customer.
 */
export async function updateCustomer(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) throw new AppError('无效的ID', 400);

  const customer = await customerService.updateCustomer(id, req.body);
  sendSuccess(res, customer, '客户更新成功');
}

/**
 * DELETE /api/customers/:id
 * Deletes a customer.
 */
export async function deleteCustomer(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) throw new AppError('无效的ID', 400);

  await customerService.deleteCustomer(id);
  sendSuccess(res, undefined, '客户删除成功');
}

// ============ Contact endpoints ============

/**
 * GET /api/customers/:id/contacts
 * Retrieves all contacts for a customer.
 */
export async function getContacts(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const customerId = parseInt(req.params.id, 10);
  if (isNaN(customerId)) throw new AppError('无效的客户ID', 400);

  const status = req.query.status as string | undefined;
  const contacts = await customerService.getContacts(customerId, status);
  sendSuccess(res, contacts);
}

/**
 * POST /api/customers/:id/contacts
 * Creates a new contact for a customer.
 */
export async function createContact(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const customerId = parseInt(req.params.id, 10);
  if (isNaN(customerId)) throw new AppError('无效的客户ID', 400);

  const contact = await customerService.createContact(customerId, req.body);
  sendSuccess(res, contact, '联系人创建成功', 201);
}

/**
 * PUT /api/customers/:id/contacts/:contactId
 * Updates a contact.
 */
export async function updateContact(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const customerId = parseInt(req.params.id, 10);
  const contactId = parseInt(req.params.contactId, 10);
  if (isNaN(customerId) || isNaN(contactId)) {
    throw new AppError('无效的ID', 400);
  }

  const contact = await customerService.updateContact(customerId, contactId, req.body);
  sendSuccess(res, contact, '联系人更新成功');
}

/**
 * DELETE /api/customers/:id/contacts/:contactId
 * Deletes a contact.
 */
export async function deleteContact(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const customerId = parseInt(req.params.id, 10);
  const contactId = parseInt(req.params.contactId, 10);
  if (isNaN(customerId) || isNaN(contactId)) {
    throw new AppError('无效的ID', 400);
  }

  await customerService.deleteContact(customerId, contactId);
  sendSuccess(res, undefined, '联系人删除成功');
}
