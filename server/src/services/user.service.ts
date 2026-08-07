/**
 * User management service.
 * Handles CRUD operations for system users.
 */
import prisma from '../utils/prisma';
import { hashPassword, validatePasswordStrength } from '../utils/password';
import { AppError } from '../utils/apiResponse';
import { UserDTO } from '../types';

/**
 * Converts a Prisma User entity to a UserDTO.
 */
function toUserDTO(user: {
  id: number;
  username: string;
  displayName: string;
  phone: string | null;
  roleId: number;
  status: string;
  mustChangePassword: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  role: { id: number; name: string };
}): UserDTO {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    phone: user.phone,
    roleId: user.roleId,
    roleName: user.role.name,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

/**
 * Retrieves all users with their role info.
 * @returns Array of user DTOs.
 */
export async function getUserList(): Promise<UserDTO[]> {
  const users = await prisma.user.findMany({
    include: { role: true },
    orderBy: { createdAt: 'desc' },
  });

  return users.map(toUserDTO);
}

/** Input data for creating a user. */
export interface CreateUserInput {
  username: string;
  displayName: string;
  password: string;
  roleId: number;
  phone: string | null;
}

/**
 * Creates a new user.
 * @param data - The user data.
 * @returns The created user DTO.
 * @throws AppError if username is taken, password is weak, or role not found.
 */
export async function createUser(data: CreateUserInput): Promise<UserDTO> {
  if (!data.username || data.username.trim().length === 0) {
    throw new AppError('请填写用户名', 400);
  }
  if (!data.displayName || data.displayName.trim().length === 0) {
    throw new AppError('请填写姓名', 400);
  }
  if (!validatePasswordStrength(data.password)) {
    throw new AppError('密码至少8位，必须包含字母和数字', 400);
  }

  // Check username uniqueness.
  const existing = await prisma.user.findUnique({
    where: { username: data.username.trim() },
  });
  if (existing) {
    throw new AppError('用户名已存在', 409);
  }

  // Validate role exists.
  const role = await prisma.role.findUnique({ where: { id: data.roleId } });
  if (!role) {
    throw new AppError('角色不存在', 400);
  }

  const user = await prisma.user.create({
    data: {
      username: data.username.trim(),
      passwordHash: hashPassword(data.password),
      displayName: data.displayName.trim(),
      phone: data.phone,
      roleId: data.roleId,
      status: 'active',
      mustChangePassword: true,
    },
    include: { role: true },
  });

  return toUserDTO(user);
}

/** Input data for updating a user. */
export interface UpdateUserInput {
  displayName?: string;
  roleId?: number;
  phone?: string | null;
}

/**
 * Updates a user.
 * @param id - The user ID.
 * @param data - The update data.
 * @returns The updated user DTO.
 */
export async function updateUser(
  id: number,
  data: UpdateUserInput,
): Promise<UserDTO> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError('用户不存在', 404);
  }

  // Prevent modifying the admin account's role.
  if (user.username === 'admin' && data.roleId !== undefined && data.roleId !== user.roleId) {
    throw new AppError('不可修改admin账号的角色', 400);
  }

  const updateData: {
    displayName?: string;
    roleId?: number;
    phone?: string | null;
  } = {};

  if (data.displayName !== undefined) {
    if (data.displayName.trim().length === 0) {
      throw new AppError('请填写姓名', 400);
    }
    updateData.displayName = data.displayName.trim();
  }
  if (data.roleId !== undefined) {
    const role = await prisma.role.findUnique({ where: { id: data.roleId } });
    if (!role) {
      throw new AppError('角色不存在', 400);
    }
    updateData.roleId = data.roleId;
  }
  if (data.phone !== undefined) {
    updateData.phone = data.phone;
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    include: { role: true },
  });

  return toUserDTO(updated);
}

/**
 * Deletes a user.
 * Cannot delete the current logged-in user or the admin account.
 * @param id - The user ID to delete.
 * @param currentUserId - The ID of the user performing the deletion.
 * @throws AppError if trying to delete self or admin.
 */
export async function deleteUser(
  id: number,
  currentUserId: number,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError('用户不存在', 404);
  }

  if (id === currentUserId) {
    throw new AppError('不可删除当前登录用户', 400);
  }

  if (user.username === 'admin') {
    throw new AppError('不可删除admin账号', 400);
  }

  await prisma.user.delete({ where: { id } });
}

/**
 * Toggles user status (active/disabled).
 * @param id - The user ID.
 * @returns The updated user DTO.
 */
export async function toggleUserStatus(id: number): Promise<UserDTO> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError('用户不存在', 404);
  }

  if (user.username === 'admin') {
    throw new AppError('不可禁用admin账号', 400);
  }

  const newStatus = user.status === 'active' ? 'disabled' : 'active';
  const updated = await prisma.user.update({
    where: { id },
    data: { status: newStatus },
    include: { role: true },
  });

  return toUserDTO(updated);
}

/**
 * Resets a user's password.
 * The user will be required to change password on next login.
 * @param id - The user ID.
 * @param newPassword - The new password.
 * @returns The updated user DTO.
 */
export async function resetPassword(
  id: number,
  newPassword: string,
): Promise<UserDTO> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError('用户不存在', 404);
  }

  if (!validatePasswordStrength(newPassword)) {
    throw new AppError('密码至少8位，必须包含字母和数字', 400);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      passwordHash: hashPassword(newPassword),
      mustChangePassword: true,
    },
    include: { role: true },
  });

  return toUserDTO(updated);
}
