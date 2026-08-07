/**
 * Customer API module.
 */
import apiClient from './client';
import type { Customer, Contact, ApiResponse } from '../types';

/** Create customer request body. */
export interface CreateCustomerRequest {
  name: string;
}

/** Update customer request body. */
export interface UpdateCustomerRequest {
  name?: string;
  status?: string;
}

/** Create contact request body. */
export interface CreateContactRequest {
  name: string;
  phone: string | null;
}

/** Update contact request body. */
export interface UpdateContactRequest {
  name?: string;
  phone?: string | null;
  status?: string;
}

// ============ Customer endpoints ============

/**
 * Retrieves all customers.
 */
export async function getCustomerList(status?: string): Promise<Customer[]> {
  const res = await apiClient.get<ApiResponse<Customer[]>>('/customers', {
    params: status ? { status } : undefined,
  });
  return res.data.data!;
}

/**
 * Creates a new customer.
 */
export async function createCustomer(data: CreateCustomerRequest): Promise<Customer> {
  const res = await apiClient.post<ApiResponse<Customer>>('/customers', data);
  return res.data.data!;
}

/**
 * Updates a customer.
 */
export async function updateCustomer(
  id: number,
  data: UpdateCustomerRequest,
): Promise<Customer> {
  const res = await apiClient.put<ApiResponse<Customer>>(`/customers/${id}`, data);
  return res.data.data!;
}

/**
 * Deletes a customer.
 */
export async function deleteCustomer(id: number): Promise<void> {
  await apiClient.delete(`/customers/${id}`);
}

// ============ Contact endpoints ============

/**
 * Retrieves all contacts for a customer.
 */
export async function getContacts(customerId: number, status?: string): Promise<Contact[]> {
  const res = await apiClient.get<ApiResponse<Contact[]>>(
    `/customers/${customerId}/contacts`,
    { params: status ? { status } : undefined },
  );
  return res.data.data!;
}

/**
 * Creates a new contact for a customer.
 */
export async function createContact(
  customerId: number,
  data: CreateContactRequest,
): Promise<Contact> {
  const res = await apiClient.post<ApiResponse<Contact>>(
    `/customers/${customerId}/contacts`,
    data,
  );
  return res.data.data!;
}

/**
 * Updates a contact.
 */
export async function updateContact(
  customerId: number,
  contactId: number,
  data: UpdateContactRequest,
): Promise<Contact> {
  const res = await apiClient.put<ApiResponse<Contact>>(
    `/customers/${customerId}/contacts/${contactId}`,
    data,
  );
  return res.data.data!;
}

/**
 * Deletes a contact.
 */
export async function deleteContact(customerId: number, contactId: number): Promise<void> {
  await apiClient.delete(`/customers/${customerId}/contacts/${contactId}`);
}
