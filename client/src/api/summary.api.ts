/**
 * Summary query API module.
 */
import apiClient from './client';
import type {
  OverviewSummary,
  CompositeResult,
  StaffSummaryItem,
  DashboardData,
  ApiResponse,
} from '../types';

/** Composite query parameters. */
export interface CompositeQueryParams {
  customerIds?: string;
  startDate?: string;
  endDate?: string;
  isPaid?: string;
}

/** Dashboard query parameters (date range filter). */
export interface DashboardQueryParams {
  startDate?: string;
  endDate?: string;
}

/**
 * Retrieves the overall summary statistics.
 */
export async function getOverview(): Promise<OverviewSummary> {
  const res = await apiClient.get<ApiResponse<OverviewSummary>>('/summary/overview');
  return res.data.data!;
}

/**
 * Performs a composite query with multiple filters.
 */
export async function getComposite(
  params: CompositeQueryParams,
): Promise<CompositeResult> {
  const res = await apiClient.get<ApiResponse<CompositeResult>>('/summary/composite', {
    params,
  });
  return res.data.data!;
}

/**
 * Retrieves per-staff summary statistics.
 */
export async function getStaffSummary(): Promise<StaffSummaryItem[]> {
  const res = await apiClient.get<ApiResponse<StaffSummaryItem[]>>('/summary/staff');
  return res.data.data!;
}

// ========== Dashboard API (FEAT-1) ==========

/**
 * Retrieves all dashboard chart data in a single request.
 * @param params - Optional date range filter (startDate / endDate as ISO strings).
 */
export async function getDashboard(
  params?: DashboardQueryParams,
): Promise<DashboardData> {
  const res = await apiClient.get<ApiResponse<DashboardData>>('/summary/dashboard', {
    params,
  });
  return res.data.data!;
}

// ========== Excel Export ==========

/**
 * Exports the composite query result as an Excel (.xlsx) file download.
 * @param params - The composite query parameters.
 */
export async function exportComposite(params: CompositeQueryParams): Promise<void> {
  const res = await apiClient.get('/summary/composite/export', {
    params,
    responseType: 'blob',
  });
  const blob = new Blob([res.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  a.download = `composite_query_${yyyy}${mm}${dd}_${hh}${min}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
