/**
 * Role management service.
 * Handles CRUD operations for roles and permission management.
 */
import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../utils/apiResponse';

/** Role DTO returned by API. */
export interface RoleDTO {
  id: number;
  name: string;
  description: string | null;
  permissions: string[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Converts a Prisma Role entity to a RoleDTO.
 */
function toRoleDTO(role: {
  id: number;
  name: string;
  description: string | null;
  permissions: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
  _count?: { users: number };
}): RoleDTO {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    permissions: (role.permissions as string[]) || [],
    userCount: role._count?.users ?? 0,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
  };
}

/**
 * Retrieves all roles with user counts.
 * @returns Array of role DTOs.
 */
export async function getRoleList(): Promise<RoleDTO[]> {
  const roles = await prisma.role.findMany({
    include: { _count: { select: { users: true } } },
    orderBy: { id: 'asc' },
  });

  return roles.map(toRoleDTO);
}

/** Input data for creating a role. */
export interface CreateRoleInput {
  name: string;
  description: string | null;
  permissions: string[];
}

/**
 * Creates a new role.
 * @param data - The role data.
 * @returns The created role DTO.
 */
export async function createRole(data: CreateRoleInput): Promise<RoleDTO> {
  if (!data.name || data.name.trim().length === 0) {
    throw new AppError('请填写角色名称', 400);
  }

  const existing = await prisma.role.findUnique({
    where: { name: data.name.trim() },
  });
  if (existing) {
    throw new AppError('角色名称已存在', 409);
  }

  const role = await prisma.role.create({
    data: {
      name: data.name.trim(),
      description: data.description,
      permissions: data.permissions,
    },
    include: { _count: { select: { users: true } } },
  });

  return toRoleDTO(role);
}

/** Input data for updating a role. */
export interface UpdateRoleInput {
  name?: string;
  description?: string | null;
  permissions?: string[];
}

/**
 * Updates a role.
 * @param id - The role ID.
 * @param data - The update data.
 * @returns The updated role DTO.
 */
export async function updateRole(
  id: number,
  data: UpdateRoleInput,
): Promise<RoleDTO> {
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) {
    throw new AppError('角色不存在', 404);
  }

  const updateData: {
    name?: string;
    description?: string | null;
    permissions?: string[];
  } = {};

  if (data.name !== undefined) {
    if (data.name.trim().length === 0) {
      throw new AppError('请填写角色名称', 400);
    }
    const existing = await prisma.role.findUnique({
      where: { name: data.name.trim() },
    });
    if (existing && existing.id !== id) {
      throw new AppError('角色名称已存在', 409);
    }
    updateData.name = data.name.trim();
  }
  if (data.description !== undefined) {
    updateData.description = data.description;
  }
  if (data.permissions !== undefined) {
    updateData.permissions = data.permissions;
  }

  const updated = await prisma.role.update({
    where: { id },
    data: updateData,
    include: { _count: { select: { users: true } } },
  });

  return toRoleDTO(updated);
}

/**
 * Deletes a role.
 * Cannot delete a role that has associated users.
 * @param id - The role ID.
 * @throws AppError if role has associated users.
 */
export async function deleteRole(id: number): Promise<void> {
  const role = await prisma.role.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });

  if (!role) {
    throw new AppError('角色不存在', 404);
  }

  if (role._count.users > 0) {
    throw new AppError(
      `该角色已关联${role._count.users}个用户，无法删除`,
      400,
    );
  }

  await prisma.role.delete({ where: { id } });
}
