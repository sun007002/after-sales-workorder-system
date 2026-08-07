/**
 * Authentication service.
 * Handles login, logout, password change, and current user retrieval.
 */
import prisma from '../utils/prisma';
import { signToken } from '../utils/jwt';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password';
import { AppError } from '../utils/apiResponse';
import config from '../config';
import { AuthUser, UserDTO } from '../types';

/** Login result containing token and user info. */
export interface LoginResult {
  token: string;
  user: UserDTO;
  mustChangePassword: boolean;
}

/**
 * Converts a Prisma User entity to a UserDTO.
 */
function toUserDTO(
  user: {
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
  },
): UserDTO {
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
 * Authenticates a user with username and password.
 * Implements login lockout after max failed attempts.
 * @param username - The username (case-insensitive).
 * @param password - The plaintext password.
 * @returns Login result with JWT token and user info.
 * @throws AppError if credentials are invalid or account is locked.
 */
export async function login(username: string, password: string): Promise<LoginResult> {
  // Case-insensitive username lookup.
  const user = await prisma.user.findFirst({
    where: {
      username: { equals: username },
    },
    include: { role: true },
  });

  if (!user) {
    throw new AppError('用户名或密码错误', 401);
  }

  // Check account status.
  if (user.status !== 'active') {
    throw new AppError('账号已被禁用，请联系管理员', 403);
  }

  // Check account lock.
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const remainingMinutes = Math.ceil(
      (user.lockedUntil.getTime() - Date.now()) / 60000,
    );
    throw new AppError(
      `账号已锁定，请${remainingMinutes}分钟后再试`,
      423,
    );
  }

  // Verify password.
  const isPasswordValid = comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    const newFailedCount = user.failedLoginCount + 1;
    const shouldLock = newFailedCount >= config.security.loginMaxAttempts;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: shouldLock ? 0 : newFailedCount,
        lockedUntil: shouldLock
          ? new Date(Date.now() + config.security.lockDurationMinutes * 60000)
          : null,
      },
    });

    if (shouldLock) {
      throw new AppError(
        `密码错误次数过多，账号已锁定${config.security.lockDurationMinutes}分钟`,
        423,
      );
    }

    const remaining = config.security.loginMaxAttempts - newFailedCount;
    throw new AppError(
      `用户名或密码错误，剩余尝试次数${remaining}次`,
      401,
    );
  }

  // Reset failed login count and update last login time.
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
    include: { role: true },
  });

  // Sign JWT token.
  const token = signToken({
    userId: user.id,
    roleId: user.roleId,
    username: user.username,
  });

  return {
    token,
    user: toUserDTO(updatedUser),
    mustChangePassword: user.mustChangePassword,
  };
}

/**
 * Retrieves the current user's information including permissions.
 * @param authUser - The authenticated user context.
 * @returns User DTO with role info.
 */
export async function getCurrentUser(authUser: AuthUser): Promise<{
  user: UserDTO;
  permissions: string[];
}> {
  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    include: { role: true },
  });

  if (!user) {
    throw new AppError('用户不存在', 404);
  }

  return {
    user: toUserDTO(user),
    permissions: (user.role.permissions as string[]) || [],
  };
}

/**
 * Changes the user's password.
 * @param userId - The user ID.
 * @param oldPassword - The current password for verification.
 * @param newPassword - The new password to set.
 * @throws AppError if old password is incorrect or new password is weak.
 */
export async function changePassword(
  userId: number,
  oldPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('用户不存在', 404);
  }

  // Verify old password.
  if (!comparePassword(oldPassword, user.passwordHash)) {
    throw new AppError('原密码错误', 400);
  }

  // Validate new password strength.
  if (!validatePasswordStrength(newPassword)) {
    throw new AppError('新密码至少8位，必须包含字母和数字', 400);
  }

  // Update password.
  const newHash = hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: newHash,
      mustChangePassword: false,
    },
  });
}
