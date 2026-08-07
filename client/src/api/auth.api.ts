/**
 * Authentication API module.
 */
import apiClient from './client';
import type { LoginResult, CurrentUserInfo, ApiResponse } from '../types';

/** Login request body. */
interface LoginRequest {
  username: string;
  password: string;
}

/** Change password request body. */
interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

/**
 * Logs in with username and password.
 */
export async function login(username: string, password: string): Promise<LoginResult> {
  const res = await apiClient.post<ApiResponse<LoginResult>>('/auth/login', {
    username,
    password,
  } as LoginRequest);
  return res.data.data!;
}

/**
 * Logs out the current user.
 */
export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

/**
 * Gets the current authenticated user's info and permissions.
 */
export async function getMe(): Promise<CurrentUserInfo> {
  const res = await apiClient.get<ApiResponse<CurrentUserInfo>>('/auth/me');
  return res.data.data!;
}

/**
 * Changes the current user's password.
 */
export async function changePassword(
  oldPassword: string,
  newPassword: string,
): Promise<void> {
  await apiClient.put('/auth/change-password', {
    oldPassword,
    newPassword,
  } as ChangePasswordRequest);
}
