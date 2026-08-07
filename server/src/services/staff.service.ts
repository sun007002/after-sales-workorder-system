/**
 * After-sales staff service.
 * Handles CRUD operations for after-sales staff members.
 */
import prisma from '../utils/prisma';
import { AppError } from '../utils/apiResponse';

/** Staff DTO returned by API. */
export interface StaffDTO {
  id: number;
  name: string;
  phone: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Converts a Prisma AfterSalesStaff entity to a StaffDTO.
 */
function toStaffDTO(staff: {
  id: number;
  name: string;
  phone: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): StaffDTO {
  return {
    id: staff.id,
    name: staff.name,
    phone: staff.phone,
    status: staff.status,
    createdAt: staff.createdAt.toISOString(),
    updatedAt: staff.updatedAt.toISOString(),
  };
}

/**
 * Retrieves all after-sales staff, optionally filtered by status.
 * @param status - Optional status filter ('active' | 'disabled').
 * @returns Array of staff DTOs.
 */
export async function getStaffList(status?: string): Promise<StaffDTO[]> {
  const where: { status?: string } = {};
  if (status) {
    where.status = status;
  }

  const staffList = await prisma.afterSalesStaff.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return staffList.map(toStaffDTO);
}

/**
 * Retrieves active staff names for dropdown selection.
 * @returns Array of staff names.
 */
export async function getActiveStaffNames(): Promise<{ id: number; name: string }[]> {
  const staffList = await prisma.afterSalesStaff.findMany({
    where: { status: 'active' },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  return staffList;
}

/** Input data for creating staff. */
export interface CreateStaffInput {
  name: string;
  phone: string | null;
}

/**
 * Creates a new after-sales staff member.
 * @param data - The staff data.
 * @returns The created staff DTO.
 */
export async function createStaff(data: CreateStaffInput): Promise<StaffDTO> {
  if (!data.name || data.name.trim().length === 0) {
    throw new AppError('请填写售后人员姓名', 400);
  }

  const staff = await prisma.afterSalesStaff.create({
    data: {
      name: data.name.trim(),
      phone: data.phone,
      status: 'active',
    },
  });

  return toStaffDTO(staff);
}

/** Input data for updating staff. */
export interface UpdateStaffInput {
  name?: string;
  phone?: string | null;
}

/**
 * Updates an after-sales staff member.
 * @param id - The staff ID.
 * @param data - The update data.
 * @returns The updated staff DTO.
 */
export async function updateStaff(
  id: number,
  data: UpdateStaffInput,
): Promise<StaffDTO> {
  const staff = await prisma.afterSalesStaff.findUnique({ where: { id } });
  if (!staff) {
    throw new AppError('售后人员不存在', 404);
  }

  const updateData: { name?: string; phone?: string | null } = {};
  if (data.name !== undefined) {
    if (data.name.trim().length === 0) {
      throw new AppError('请填写售后人员姓名', 400);
    }
    updateData.name = data.name.trim();
  }
  if (data.phone !== undefined) {
    updateData.phone = data.phone;
  }

  const updated = await prisma.afterSalesStaff.update({
    where: { id },
    data: updateData,
  });

  return toStaffDTO(updated);
}

/**
 * Deletes an after-sales staff member.
 * Checks if the staff is referenced by any work orders before deletion.
 * @param id - The staff ID.
 * @throws AppError if staff is referenced by work orders.
 */
export async function deleteStaff(id: number): Promise<void> {
  const staff = await prisma.afterSalesStaff.findUnique({ where: { id } });
  if (!staff) {
    throw new AppError('售后人员不存在', 404);
  }

  // Check if staff name is used in any work orders.
  const workOrderCount = await prisma.workOrder.count({
    where: {
      isDeleted: false,
      staffNames: { contains: staff.name },
    },
  });

  if (workOrderCount > 0) {
    throw new AppError(
      `该售后人员已关联${workOrderCount}个工单，无法删除，请改为禁用`,
      400,
    );
  }

  await prisma.afterSalesStaff.delete({ where: { id } });
}

/**
 * Toggles the status of an after-sales staff member (active/disabled).
 * @param id - The staff ID.
 * @returns The updated staff DTO.
 */
export async function toggleStaffStatus(id: number): Promise<StaffDTO> {
  const staff = await prisma.afterSalesStaff.findUnique({ where: { id } });
  if (!staff) {
    throw new AppError('售后人员不存在', 404);
  }

  const newStatus = staff.status === 'active' ? 'disabled' : 'active';
  const updated = await prisma.afterSalesStaff.update({
    where: { id },
    data: { status: newStatus },
  });

  return toStaffDTO(updated);
}
