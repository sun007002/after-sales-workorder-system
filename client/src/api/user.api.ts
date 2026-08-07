/**
 * User management API module.
 */
import apiClient from './client';
import type { User, ApiResponse } from '../types';

/** Create user request body. */
export interface CreateUserRequest {
  username: string;
  displayName: string;
  password: string;
  roleId: number;
  phone: string | null;
}

/** Update user request body. */
export interface UpdateUserRequest {
  displayName?: string;
  roleId?: number;
  phone?: string | null;
}

/**
 * Retrieves all users.
 */
export async function getUserList(): Promise<User[]> {
  const res = await apiClient.get<ApiResponse<User[]>>('/users');
  return res.data.data!;
}

/**
 * Creates a new user.
 */
export async function createUser(data: CreateUserRequest): Promise<User> {
  const res = await apiClient.post<ApiResponse<User>>('/users', data);
  return res.data.data!;
}

/**
 * Updates a user.
 */
export async function updateUser(id: number, data: UpdateUserRequest): Promise<User> {
  const res = await apiClient.put<ApiResponse<User>>(`/users/${id}`, data);
  return res.data.data!;
}

/**
 * Deletes a user.
 */
export async function deleteUser(id: number): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}

/**
 * Toggles user status (active/disabled).
 */
export async function toggleUserStatus(id: number): Promise<User> {
  const res = await apiClient.patch<ApiResponse<User>>(`/users/${id}/status`);
  return res.data.data!;
}

/**
 * Resets a user's password.
 */
export async function resetPassword(id: number, newPassword: string): Promise<User> {
  const res = await apiClient.put<ApiResponse<User>>(`/users/${id}/reset-password`, {
    newPassword,
  });
  return res.data.data!;
}
