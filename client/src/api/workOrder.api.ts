/**
 * Work order API module.
 */
import apiClient from './client';
import type {
  WorkOrder,
  WorkOrderFile,
  PaginatedData,
  ApiResponse,
  WorkOrderQueryParams,
} from '../types';

/** Create work order request body. */
export interface CreateWorkOrderRequest {
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

/** Update work order request body. */
export interface UpdateWorkOrderRequest extends Partial<CreateWorkOrderRequest> {}

/**
 * Retrieves a paginated list of work orders.
 */
export async function getWorkOrders(
  params: WorkOrderQueryParams,
): Promise<PaginatedData<WorkOrder>> {
  const res = await apiClient.get<ApiResponse<PaginatedData<WorkOrder>>>('/work-orders', {
    params,
  });
  return res.data.data!;
}

/**
 * Retrieves a single work order by ID.
 */
export async function getWorkOrderById(id: number): Promise<WorkOrder> {
  const res = await apiClient.get<ApiResponse<WorkOrder>>(`/work-orders/${id}`);
  return res.data.data!;
}

/**
 * Creates a new work order.
 */
export async function createWorkOrder(
  data: CreateWorkOrderRequest,
): Promise<WorkOrder> {
  const res = await apiClient.post<ApiResponse<WorkOrder>>('/work-orders', data);
  return res.data.data!;
}

/**
 * Updates an existing work order.
 */
export async function updateWorkOrder(
  id: number,
  data: UpdateWorkOrderRequest,
): Promise<WorkOrder> {
  const res = await apiClient.put<ApiResponse<WorkOrder>>(`/work-orders/${id}`, data);
  return res.data.data!;
}

/**
 * Soft-deletes a work order.
 */
export async function deleteWorkOrder(id: number): Promise<void> {
  await apiClient.delete(`/work-orders/${id}`);
}

/**
 * Updates the payment status of a work order.
 */
export async function updatePaymentStatus(
  id: number,
  isPaid: boolean,
): Promise<WorkOrder> {
  const res = await apiClient.patch<ApiResponse<WorkOrder>>(
    `/work-orders/${id}/payment`,
    { isPaid },
  );
  return res.data.data!;
}

/**
 * Retrieves the most recent work orders (for dashboard).
 */
export async function getRecentWorkOrders(limit: number = 5): Promise<WorkOrder[]> {
  const res = await apiClient.get<ApiResponse<WorkOrder[]>>('/work-orders/recent', {
    params: { limit },
  });
  return res.data.data!;
}

// ========== File Upload API (FEAT-3) ==========

/**
 * Uploads a file to a work order (multipart/form-data).
 */
export async function uploadFile(
  workOrderId: number,
  file: File,
): Promise<WorkOrderFile> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiClient.post<ApiResponse<WorkOrderFile>>(
    `/work-orders/${workOrderId}/files`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
  return res.data.data!;
}

/**
 * Retrieves the file list for a work order.
 */
export async function getFiles(workOrderId: number): Promise<WorkOrderFile[]> {
  const res = await apiClient.get<ApiResponse<WorkOrderFile[]>>(
    `/work-orders/${workOrderId}/files`,
  );
  return res.data.data!;
}

/**
 * Downloads a file as a Blob (authorized via axios interceptor Bearer token).
 */
export async function downloadFileBlob(
  workOrderId: number,
  fileId: number,
): Promise<Blob> {
  const res = await apiClient.get(
    `/work-orders/${workOrderId}/files/${fileId}/download`,
    { responseType: 'blob' },
  );
  return res.data as Blob;
}

/**
 * Deletes a file from a work order.
 */
export async function deleteFile(
  workOrderId: number,
  fileId: number,
): Promise<void> {
  await apiClient.delete(`/work-orders/${workOrderId}/files/${fileId}`);
}
