/**
 * Staff API module.
 */
import apiClient from './client';
import type { Staff, ApiResponse } from '../types';

/** Create staff request body. */
export interface CreateStaffRequest {
  name: string;
  phone: string | null;
}

/** Update staff request body. */
export interface UpdateStaffRequest {
  name?: string;
  phone?: string | null;
}

/**
 * Retrieves all after-sales staff.
 */
export async function getStaffList(status?: string): Promise<Staff[]> {
  const res = await apiClient.get<ApiResponse<Staff[]>>('/staff', {
    params: status ? { status } : undefined,
  });
  return res.data.data!;
}

/**
 * Creates a new staff member.
 */
export async function createStaff(data: CreateStaffRequest): Promise<Staff> {
  const res = await apiClient.post<ApiResponse<Staff>>('/staff', data);
  return res.data.data!;
}

/**
 * Updates a staff member.
 */
export async function updateStaff(id: number, data: UpdateStaffRequest): Promise<Staff> {
  const res = await apiClient.put<ApiResponse<Staff>>(`/staff/${id}`, data);
  return res.data.data!;
}

/**
 * Deletes a staff member.
 */
export async function deleteStaff(id: number): Promise<void> {
  await apiClient.delete(`/staff/${id}`);
}

/**
 * Toggles staff status (active/disabled).
 */
export async function toggleStaffStatus(id: number): Promise<Staff> {
  const res = await apiClient.patch<ApiResponse<Staff>>(`/staff/${id}/status`);
  return res.data.data!;
}
