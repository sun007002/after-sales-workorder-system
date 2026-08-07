/**
 * Customer service.
 * Handles CRUD operations for customers and their contacts.
 */
import prisma from '../utils/prisma';
import { AppError } from '../utils/apiResponse';

/** Customer DTO returned by API. */
export interface CustomerDTO {
  id: number;
  name: string;
  status: string;
  contactCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Contact DTO returned by API. */
export interface ContactDTO {
  id: number;
  customerId: number;
  name: string;
  phone: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Converts a Prisma Customer entity (with contact count) to a CustomerDTO.
 */
function toCustomerDTO(customer: {
  id: number;
  name: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: { contacts: number };
}): CustomerDTO {
  return {
    id: customer.id,
    name: customer.name,
    status: customer.status,
    contactCount: customer._count?.contacts ?? 0,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  };
}

/**
 * Converts a Prisma CustomerContact entity to a ContactDTO.
 */
function toContactDTO(contact: {
  id: number;
  customerId: number;
  name: string;
  phone: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): ContactDTO {
  return {
    id: contact.id,
    customerId: contact.customerId,
    name: contact.name,
    phone: contact.phone,
    status: contact.status,
    createdAt: contact.createdAt.toISOString(),
    updatedAt: contact.updatedAt.toISOString(),
  };
}

/**
 * Retrieves all customers, optionally filtered by status.
 * @param status - Optional status filter.
 * @returns Array of customer DTOs with contact counts.
 */
export async function getCustomerList(status?: string): Promise<CustomerDTO[]> {
  const where: { status?: string } = {};
  if (status) {
    where.status = status;
  }

  const customers = await prisma.customer.findMany({
    where,
    include: { _count: { select: { contacts: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return customers.map(toCustomerDTO);
}

/**
 * Retrieves active customer names for dropdown selection.
 * @returns Array of customer id and name.
 */
export async function getActiveCustomerNames(): Promise<{ id: number; name: string }[]> {
  return prisma.customer.findMany({
    where: { status: 'active' },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}

/** Input data for creating a customer. */
export interface CreateCustomerInput {
  name: string;
}

/**
 * Creates a new customer.
 * @param data - The customer data.
 * @returns The created customer DTO.
 */
export async function createCustomer(data: CreateCustomerInput): Promise<CustomerDTO> {
  if (!data.name || data.name.trim().length === 0) {
    throw new AppError('请填写客户名称', 400);
  }

  const existing = await prisma.customer.findUnique({
    where: { name: data.name.trim() },
  });
  if (existing) {
    throw new AppError('客户名称已存在', 409);
  }

  const customer = await prisma.customer.create({
    data: {
      name: data.name.trim(),
      status: 'active',
    },
    include: { _count: { select: { contacts: true } } },
  });

  return toCustomerDTO(customer);
}

/** Input data for updating a customer. */
export interface UpdateCustomerInput {
  name?: string;
  status?: string;
}

/**
 * Updates a customer.
 * @param id - The customer ID.
 * @param data - The update data.
 * @returns The updated customer DTO.
 */
export async function updateCustomer(
  id: number,
  data: UpdateCustomerInput,
): Promise<CustomerDTO> {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) {
    throw new AppError('客户不存在', 404);
  }

  const updateData: { name?: string; status?: string } = {};
  if (data.name !== undefined) {
    if (data.name.trim().length === 0) {
      throw new AppError('请填写客户名称', 400);
    }
    const existing = await prisma.customer.findUnique({
      where: { name: data.name.trim() },
    });
    if (existing && existing.id !== id) {
      throw new AppError('客户名称已存在', 409);
    }
    updateData.name = data.name.trim();
  }
  if (data.status !== undefined) {
    updateData.status = data.status;
  }

  const updated = await prisma.customer.update({
    where: { id },
    data: updateData,
    include: { _count: { select: { contacts: true } } },
  });

  return toCustomerDTO(updated);
}

/**
 * Deletes a customer.
 * Checks if the customer is referenced by any work orders before deletion.
 * @param id - The customer ID.
 * @throws AppError if customer is referenced by work orders.
 */
export async function deleteCustomer(id: number): Promise<void> {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) {
    throw new AppError('客户不存在', 404);
  }

  const workOrderCount = await prisma.workOrder.count({
    where: { customerId: id, isDeleted: false },
  });

  if (workOrderCount > 0) {
    throw new AppError(
      `该客户已关联${workOrderCount}个工单，无法删除`,
      400,
    );
  }

  await prisma.customer.delete({ where: { id } });
}

// ============ Contact operations ============

/**
 * Retrieves all contacts for a specific customer.
 * @param customerId - The customer ID.
 * @param status - Optional status filter.
 * @returns Array of contact DTOs.
 */
export async function getContacts(
  customerId: number,
  status?: string,
): Promise<ContactDTO[]> {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    throw new AppError('客户不存在', 404);
  }

  const where: { customerId: number; status?: string } = { customerId };
  if (status) {
    where.status = status;
  }

  const contacts = await prisma.customerContact.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return contacts.map(toContactDTO);
}

/** Input data for creating a contact. */
export interface CreateContactInput {
  name: string;
  phone: string | null;
}

/**
 * Creates a new contact for a customer.
 * @param customerId - The customer ID.
 * @param data - The contact data.
 * @returns The created contact DTO.
 */
export async function createContact(
  customerId: number,
  data: CreateContactInput,
): Promise<ContactDTO> {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    throw new AppError('客户不存在', 404);
  }

  if (!data.name || data.name.trim().length === 0) {
    throw new AppError('请填写联系人姓名', 400);
  }

  const contact = await prisma.customerContact.create({
    data: {
      customerId,
      name: data.name.trim(),
      phone: data.phone,
      status: 'active',
    },
  });

  return toContactDTO(contact);
}

/** Input data for updating a contact. */
export interface UpdateContactInput {
  name?: string;
  phone?: string | null;
  status?: string;
}

/**
 * Updates a contact.
 * @param customerId - The customer ID.
 * @param contactId - The contact ID.
 * @param data - The update data.
 * @returns The updated contact DTO.
 */
export async function updateContact(
  customerId: number,
  contactId: number,
  data: UpdateContactInput,
): Promise<ContactDTO> {
  const contact = await prisma.customerContact.findFirst({
    where: { id: contactId, customerId },
  });
  if (!contact) {
    throw new AppError('联系人不存在', 404);
  }

  const updateData: { name?: string; phone?: string | null; status?: string } = {};
  if (data.name !== undefined) {
    if (data.name.trim().length === 0) {
      throw new AppError('请填写联系人姓名', 400);
    }
    updateData.name = data.name.trim();
  }
  if (data.phone !== undefined) {
    updateData.phone = data.phone;
  }
  if (data.status !== undefined) {
    updateData.status = data.status;
  }

  const updated = await prisma.customerContact.update({
    where: { id: contactId },
    data: updateData,
  });

  return toContactDTO(updated);
}

/**
 * Deletes a contact.
 * Checks if the contact is referenced by any work orders before deletion.
 * @param customerId - The customer ID.
 * @param contactId - The contact ID.
 * @throws AppError if contact is referenced by work orders.
 */
export async function deleteContact(
  customerId: number,
  contactId: number,
): Promise<void> {
  const contact = await prisma.customerContact.findFirst({
    where: { id: contactId, customerId },
  });
  if (!contact) {
    throw new AppError('联系人不存在', 404);
  }

  const workOrderCount = await prisma.workOrder.count({
    where: { contactId, isDeleted: false },
  });

  if (workOrderCount > 0) {
    throw new AppError(
      `该联系人已关联${workOrderCount}个工单，无法删除`,
      400,
    );
  }

  await prisma.customerContact.delete({ where: { id: contactId } });
}
