/**
 * Work order service.
 * Handles CRUD operations for work orders, including data-level
 * permission filtering, amount calculation, and soft deletion.
 */
import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { generateOrderNo } from '../utils/orderNo';
import { AppError } from '../utils/apiResponse';
import { STAFF_NAMES_SEPARATOR, AuthUser, WorkOrderDTO, WorkOrderQuery } from '../types';
import { isEngineerRole } from '../middleware/rbac';

/**
 * Converts a Prisma WorkOrder entity (with relations) to a WorkOrderDTO.
 */
function toWorkOrderDTO(
  wo: {
    id: number;
    orderNo: string;
    customerId: number;
    contactId: number;
    contactPhone: string | null;
    staffNames: string;
    description: string;
    laborCost: Prisma.Decimal;
    materialCost: Prisma.Decimal;
    travelCost: Prisma.Decimal;
    totalAmount: Prisma.Decimal;
    isPaid: boolean;
    isDeleted: boolean;
    startTime: Date | null;
    endTime: Date | null;
    createdBy: number;
    updatedBy: number | null;
    createdAt: Date;
    updatedAt: Date;
    customer: { id: number; name: string };
    contact: { id: number; name: string };
    creator: { id: number; displayName: string };
    updater: { id: number; displayName: string } | null;
  },
): WorkOrderDTO {
  return {
    id: wo.id,
    orderNo: wo.orderNo,
    customerId: wo.customerId,
    customerName: wo.customer.name,
    contactId: wo.contactId,
    contactName: wo.contact.name,
    contactPhone: wo.contactPhone,
    staffNames: wo.staffNames,
    description: wo.description,
    laborCost: Number(wo.laborCost),
    materialCost: Number(wo.materialCost),
    travelCost: Number(wo.travelCost),
    totalAmount: Number(wo.totalAmount),
    isPaid: wo.isPaid,
    isDeleted: wo.isDeleted,
    startTime: wo.startTime ? wo.startTime.toISOString() : null,
    endTime: wo.endTime ? wo.endTime.toISOString() : null,
    createdBy: wo.createdBy,
    createdByName: wo.creator.displayName,
    updatedBy: wo.updatedBy,
    updatedByName: wo.updater ? wo.updater.displayName : null,
    createdAt: wo.createdAt.toISOString(),
    updatedAt: wo.updatedAt.toISOString(),
  };
}

/** Common include for work order queries with relations. */
const WORK_ORDER_INCLUDE = {
  customer: { select: { id: true, name: true } },
  contact: { select: { id: true, name: true } },
  creator: { select: { id: true, displayName: true } },
  updater: { select: { id: true, displayName: true } },
} as const;

/**
 * Builds a Prisma where clause for work order queries.
 * Applies data-level permission: engineers only see their own work orders.
 */
function buildWhereClause(
  query: WorkOrderQuery,
  authUser: AuthUser,
): Prisma.WorkOrderWhereInput {
  const where: Prisma.WorkOrderWhereInput = {
    isDeleted: false,
  };

  // Data-level permission: engineers only see work orders they participate in.
  if (isEngineerRole({ user: authUser } as never)) {
    where.staffNames = { contains: authUser.displayName };
  }

  // Keyword search (order number or customer name).
  if (query.keyword) {
    where.OR = [
      { orderNo: { contains: query.keyword } },
      { customer: { name: { contains: query.keyword } } },
    ];
  }

  // Filter by customer.
  if (query.customerId) {
    where.customerId = parseInt(query.customerId, 10);
  }

  // Filter by staff name.
  if (query.staffName) {
    const existingStaffFilter = where.staffNames as Prisma.StringFilter | undefined;
    if (existingStaffFilter && existingStaffFilter.contains) {
      // Engineer data-level filter is active — combine with query filter using AND
      // to avoid overwriting the data-level permission contains.
      where.AND = [
        ...(where.AND as Prisma.WorkOrderWhereInput[] | undefined || []),
        { staffNames: { contains: existingStaffFilter.contains } },
        { staffNames: { contains: query.staffName } },
      ];
      delete where.staffNames;
    } else {
      where.staffNames = { contains: query.staffName };
    }
  }

  // Filter by payment status.
  if (query.isPaid !== undefined && query.isPaid !== '') {
    where.isPaid = query.isPaid === 'true';
  }

  // Filter by date range (based on startTime — service start time).
  if (query.startDate || query.endDate) {
    where.startTime = {};
    if (query.startDate) {
      where.startTime.gte = new Date(query.startDate);
    }
    if (query.endDate) {
    where.startTime.lte = new Date(query.endDate);
    }
  }

  return where;
}

/**
 * Retrieves a paginated list of work orders with filtering.
 * @param query - Query parameters for filtering and pagination.
 * @param authUser - The authenticated user for data-level permissions.
 * @returns Paginated work order list.
 */
export async function getWorkOrders(
  query: WorkOrderQuery,
  authUser: AuthUser,
): Promise<{ items: WorkOrderDTO[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const pageSize = Math.max(1, Math.min(100, parseInt(query.pageSize || '20', 10)));
  const skip = (page - 1) * pageSize;

  const where = buildWhereClause(query, authUser);

  const [workOrders, total] = await Promise.all([
    prisma.workOrder.findMany({
      where,
      include: WORK_ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.workOrder.count({ where }),
  ]);

  return {
    items: workOrders.map(toWorkOrderDTO),
    total,
    page,
    pageSize,
  };
}

/**
 * Retrieves a single work order by ID.
 * @param id - The work order ID.
 * @param authUser - The authenticated user for data-level permissions.
 * @returns The work order DTO.
 * @throws AppError if not found or access denied.
 */
export async function getWorkOrderById(
  id: number,
  authUser: AuthUser,
): Promise<WorkOrderDTO> {
  const workOrder = await prisma.workOrder.findFirst({
    where: { id, isDeleted: false },
    include: WORK_ORDER_INCLUDE,
  });

  if (!workOrder) {
    throw new AppError('工单不存在', 404);
  }

  // Data-level permission check for engineers.
  if (isEngineerRole({ user: authUser } as never)) {
    if (!workOrder.staffNames.includes(authUser.displayName)) {
      throw new AppError('无权查看此工单', 403);
    }
  }

  return toWorkOrderDTO(workOrder);
}

/** Input data for creating a work order. */
export interface CreateWorkOrderInput {
  customerId: number;
  contactId: number;
  contactPhone: string | null;
  staffNames: string[];
  description: string;
  laborCost: number;
  materialCost: number;
  travelCost: number;
  isPaid: boolean;
  startTime?: string | null;
  endTime?: string | null;
}

/**
 * Creates a new work order.
 * Generates order number, calculates total amount, and validates references.
 * @param data - The work order data.
 * @param authUser - The authenticated user (creator).
 * @returns The created work order DTO.
 */
export async function createWorkOrder(
  data: CreateWorkOrderInput,
  authUser: AuthUser,
): Promise<WorkOrderDTO> {
  // Validate customer exists.
  const customer = await prisma.customer.findFirst({
    where: { id: data.customerId, status: 'active' },
  });
  if (!customer) {
    throw new AppError('客户不存在或已禁用', 400);
  }

  // Validate contact belongs to customer.
  const contact = await prisma.customerContact.findFirst({
    where: { id: data.contactId, customerId: data.customerId, status: 'active' },
  });
  if (!contact) {
    throw new AppError('联系人不存在或不属于该客户', 400);
  }

  // Validate staff names.
  if (!data.staffNames || data.staffNames.length === 0) {
    throw new AppError('请至少选择一名售后人员', 400);
  }

  // Validate description length.
  if (!data.description || data.description.length === 0) {
    throw new AppError('请填写售后描述', 400);
  }
  if (data.description.length > 1000) {
    throw new AppError('售后描述不能超过1000字', 400);
  }

  // Validate cost fields.
  const laborCost = Math.max(0, data.laborCost || 0);
  const materialCost = Math.max(0, data.materialCost || 0);
  const travelCost = Math.max(0, data.travelCost || 0);
  const maxCost = 999999.99;
  if (laborCost > maxCost || materialCost > maxCost || travelCost > maxCost) {
    throw new AppError('费用金额不能超过999999.99', 400);
  }

  // Validate start/end time: if both provided, start must be <= end.
  let startTime: Date | null = null;
  let endTime: Date | null = null;
  if (data.startTime) {
    startTime = new Date(data.startTime);
  }
  if (data.endTime) {
    endTime = new Date(data.endTime);
  }
  if (startTime && endTime && startTime > endTime) {
    throw new AppError('开始时间不能晚于结束时间', 400);
  }

  // Calculate total amount (server-side, don't trust client).
  const totalAmount = laborCost + materialCost + travelCost;

  // Generate order number.
  const orderNo = await generateOrderNo();

  // Join staff names with separator.
  const staffNamesStr = data.staffNames.join(STAFF_NAMES_SEPARATOR);

  // Create work order.
  const workOrder = await prisma.workOrder.create({
    data: {
      orderNo,
      customerId: data.customerId,
      contactId: data.contactId,
      contactPhone: data.contactPhone || contact.phone,
      staffNames: staffNamesStr,
      description: data.description,
      laborCost,
      materialCost,
      travelCost,
      totalAmount,
      isPaid: data.isPaid,
      startTime,
      endTime,
      createdBy: authUser.userId,
    },
    include: WORK_ORDER_INCLUDE,
  });

  return toWorkOrderDTO(workOrder);
}

/** Input data for updating a work order. */
export interface UpdateWorkOrderInput {
  customerId?: number;
  contactId?: number;
  contactPhone?: string | null;
  staffNames?: string[];
  description?: string;
  laborCost?: number;
  materialCost?: number;
  travelCost?: number;
  isPaid?: boolean;
  startTime?: string | null;
  endTime?: string | null;
}

/**
 * Updates an existing work order.
 * Recalculates total amount on the server side.
 * Engineers can only edit their own unpaid work orders.
 * @param id - The work order ID.
 * @param data - The update data.
 * @param authUser - The authenticated user.
 * @returns The updated work order DTO.
 */
export async function updateWorkOrder(
  id: number,
  data: UpdateWorkOrderInput,
  authUser: AuthUser,
): Promise<WorkOrderDTO> {
  const workOrder = await prisma.workOrder.findFirst({
    where: { id, isDeleted: false },
  });

  if (!workOrder) {
    throw new AppError('工单不存在', 404);
  }

  // Engineers can only edit their own unpaid work orders.
  if (isEngineerRole({ user: authUser } as never)) {
    if (!workOrder.staffNames.includes(authUser.displayName)) {
      throw new AppError('无权编辑此工单', 403);
    }
    if (workOrder.isPaid) {
      throw new AppError('已结款工单不可编辑', 403);
    }
  }

  // Build update data.
  const updateData: Prisma.WorkOrderUpdateInput = {};

  if (data.customerId !== undefined) {
    const customer = await prisma.customer.findFirst({
      where: { id: data.customerId, status: 'active' },
    });
    if (!customer) {
      throw new AppError('客户不存在或已禁用', 400);
    }
    updateData.customer = { connect: { id: data.customerId } };
  }

  if (data.contactId !== undefined) {
    const contactCustomerId = data.customerId ?? workOrder.customerId;
    const contact = await prisma.customerContact.findFirst({
      where: { id: data.contactId, customerId: contactCustomerId, status: 'active' },
    });
    if (!contact) {
      throw new AppError('联系人不存在或不属于该客户', 400);
    }
    updateData.contact = { connect: { id: data.contactId } };
  }

  if (data.contactPhone !== undefined) {
    updateData.contactPhone = data.contactPhone;
  }

  if (data.staffNames !== undefined) {
    if (data.staffNames.length === 0) {
      throw new AppError('请至少选择一名售后人员', 400);
    }
    updateData.staffNames = data.staffNames.join(STAFF_NAMES_SEPARATOR);
  }

  if (data.description !== undefined) {
    if (data.description.length === 0 || data.description.length > 1000) {
      throw new AppError('售后描述长度须为1-1000字', 400);
    }
    updateData.description = data.description;
  }

  // Recalculate total amount if any cost changes.
  const laborCost = data.laborCost !== undefined ? Math.max(0, data.laborCost) : Number(workOrder.laborCost);
  const materialCost = data.materialCost !== undefined ? Math.max(0, data.materialCost) : Number(workOrder.materialCost);
  const travelCost = data.travelCost !== undefined ? Math.max(0, data.travelCost) : Number(workOrder.travelCost);

  if (data.laborCost !== undefined) updateData.laborCost = laborCost;
  if (data.materialCost !== undefined) updateData.materialCost = materialCost;
  if (data.travelCost !== undefined) updateData.travelCost = travelCost;

  // Always recalculate total.
  updateData.totalAmount = laborCost + materialCost + travelCost;

  if (data.isPaid !== undefined) {
    updateData.isPaid = data.isPaid;
  }

  // Handle start/end time fields.
  let startTime: Date | null | undefined = undefined;
  let endTime: Date | null | undefined = undefined;

  if (data.startTime !== undefined) {
    startTime = data.startTime ? new Date(data.startTime) : null;
  }

  if (data.endTime !== undefined) {
    endTime = data.endTime ? new Date(data.endTime) : null;
  }

  // Validate: if both provided, start must be <= end.
  const effectiveStart = startTime !== undefined ? startTime : workOrder.startTime;
  const effectiveEnd = endTime !== undefined ? endTime : workOrder.endTime;
  if (effectiveStart && effectiveEnd && effectiveStart > effectiveEnd) {
    throw new AppError('开始时间不能晚于结束时间', 400);
  }

  if (startTime !== undefined) {
    updateData.startTime = startTime;
  }
  if (endTime !== undefined) {
    updateData.endTime = endTime;
  }

  updateData.updater = { connect: { id: authUser.userId } };

  const updated = await prisma.workOrder.update({
    where: { id },
    data: updateData,
    include: WORK_ORDER_INCLUDE,
  });

  return toWorkOrderDTO(updated);
}

/**
 * Soft-deletes a work order by setting isDeleted = true.
 * @param id - The work order ID.
 */
export async function deleteWorkOrder(id: number): Promise<void> {
  const workOrder = await prisma.workOrder.findFirst({
    where: { id, isDeleted: false },
  });

  if (!workOrder) {
    throw new AppError('工单不存在', 404);
  }

  await prisma.workOrder.update({
    where: { id },
    data: { isDeleted: true },
  });
}

/**
 * Updates the payment status of a work order.
 * @param id - The work order ID.
 * @param isPaid - The new payment status.
 * @param authUser - The authenticated user.
 * @returns The updated work order DTO.
 */
export async function updatePaymentStatus(
  id: number,
  isPaid: boolean,
  authUser: AuthUser,
): Promise<WorkOrderDTO> {
  const workOrder = await prisma.workOrder.findFirst({
    where: { id, isDeleted: false },
  });

  if (!workOrder) {
    throw new AppError('工单不存在', 404);
  }

  const updated = await prisma.workOrder.update({
    where: { id },
    data: {
      isPaid,
      updater: { connect: { id: authUser.userId } },
    },
    include: WORK_ORDER_INCLUDE,
  });

  return toWorkOrderDTO(updated);
}

/**
 * Retrieves the most recent work orders (for dashboard).
 * @param limit - Number of recent orders to return (default: 5).
 * @param authUser - The authenticated user for data-level permissions.
 * @returns Array of recent work order DTOs.
 */
export async function getRecentWorkOrders(
  limit: number = 5,
  authUser: AuthUser,
): Promise<WorkOrderDTO[]> {
  const where: Prisma.WorkOrderWhereInput = { isDeleted: false };

  if (isEngineerRole({ user: authUser } as never)) {
    where.staffNames = { contains: authUser.displayName };
  }

  const workOrders = await prisma.workOrder.findMany({
    where,
    include: WORK_ORDER_INCLUDE,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return workOrders.map(toWorkOrderDTO);
}
