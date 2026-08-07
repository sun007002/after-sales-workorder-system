/**
 * Role management API module.
 */
import apiClient from './client';
import type { Role, ApiResponse } from '../types';

/** Create role request body. */
export interface CreateRoleRequest {
  name: string;
  description: string | null;
  permissions: string[];
}

/** Update role request body. */
export interface UpdateRoleRequest {
  name?: string;
  description?: string | null;
  permissions?: string[];
}

/**
 * Retrieves all roles.
 */
export async function getRoleList(): Promise<Role[]> {
  const res = await apiClient.get<ApiResponse<Role[]>>('/roles');
  return res.data.data!;
}

/**
 * Creates a new role.
 */
export async function createRole(data: CreateRoleRequest): Promise<Role> {
  const res = await apiClient.post<ApiResponse<Role>>('/roles', data);
  return res.data.data!;
}

/**
 * Updates a role.
 */
export async function updateRole(id: number, data: UpdateRoleRequest): Promise<Role> {
  const res = await apiClient.put<ApiResponse<Role>>(`/roles/${id}`, data);
  return res.data.data!;
}

/**
 * Deletes a role.
 */
export async function deleteRole(id: number): Promise<void> {
  await apiClient.delete(`/roles/${id}`);
}
