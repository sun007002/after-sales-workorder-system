/**
 * Shared type definitions for the frontend.
 * These types mirror the backend types for API contract consistency.
 */

/** Permission code union type. */
export type PermissionCode =
  | 'workorder:create'
  | 'workorder:read'
  | 'workorder:update'
  | 'workorder:delete'
  | 'staff:read'
  | 'staff:manage'
  | 'customer:read'
  | 'customer:manage'
  | 'summary:view'
  | 'payment:manage'
  | 'user:manage'
  | 'role:manage';

/** Staff names separator (Chinese enumeration comma). */
export const STAFF_NAMES_SEPARATOR = '、';

/** User DTO. */
export interface User {
  id: number;
  username: string;
  displayName: string;
  phone: string | null;
  roleId: number;
  roleName: string;
  status: string;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Login response. */
export interface LoginResult {
  token: string;
  user: User;
  mustChangePassword: boolean;
}

/** Current user info with permissions. */
export interface CurrentUserInfo {
  user: User;
  permissions: string[];
}

/** Work order DTO. */
export interface WorkOrder {
  id: number;
  orderNo: string;
  customerId: number;
  customerName: string;
  contactId: number;
  contactName: string;
  contactPhone: string | null;
  staffNames: string;
  description: string;
  laborCost: number;
  materialCost: number;
  travelCost: number;
  totalAmount: number;
  isPaid: boolean;
  isDeleted: boolean;
  startTime: string | null;
  endTime: string | null;
  createdBy: number;
  createdByName: string;
  updatedBy: number | null;
  updatedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Paginated response data. */
export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** API response wrapper. */
export interface ApiResponse<T = unknown> {
  code: number;
  data?: T;
  message: string;
  errors?: object[];
}

/** After-sales staff DTO. */
export interface Staff {
  id: number;
  name: string;
  phone: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/** Customer DTO. */
export interface Customer {
  id: number;
  name: string;
  status: string;
  contactCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Contact DTO. */
export interface Contact {
  id: number;
  customerId: number;
  name: string;
  phone: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/** Role DTO. */
export interface Role {
  id: number;
  name: string;
  description: string | null;
  permissions: string[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Overview summary data. */
export interface OverviewSummary {
  totalOrders: number;
  totalLaborCost: number;
  totalMaterialCost: number;
  totalTravelCost: number;
  totalAmount: number;
  paidOrderCount: number;
  paidAmount: number;
  unpaidOrderCount: number;
  unpaidAmount: number;
}

/** Composite query item. */
export interface CompositeItem {
  id: number;
  orderNo: string;
  customerName: string;
  contactName: string;
  contactPhone: string | null;
  staffNames: string;
  description: string;
  laborCost: number;
  materialCost: number;
  travelCost: number;
  totalAmount: number;
  isPaid: boolean;
  createdAt: string;
  startTime: string | null;
}

/** Composite query result. */
export interface CompositeResult {
  items: CompositeItem[];
  summary: {
    count: number;
    totalLaborCost: number;
    totalMaterialCost: number;
    totalTravelCost: number;
    totalAmount: number;
    unpaidAmount: number;
  };
  totalCount: number;
}

/** Staff summary item. */
export interface StaffSummaryItem {
  staffId: number;
  staffName: string;
  orderCount: number;
  totalAmount: number;
  unpaidAmount: number;
}

/** Work order list query parameters. */
export interface WorkOrderQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  customerId?: number;
  staffName?: string;
  isPaid?: boolean | string;
  startDate?: string;
  endDate?: string;
}

// ========== FEAT-3: Work Order File ==========

/** Work order file DTO. */
export interface WorkOrderFile {
  id: number;
  workOrderId: number;
  fileName: string;
  originalName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadedBy: number;
  uploadedByName: string;
  createdAt: string;
}

// ========== FEAT-1: Dashboard Data ==========

/** Monthly trend item for dashboard. */
export interface MonthlyTrendItem {
  month: string;
  amount: number;
  count: number;
}

/** Cost breakdown for dashboard. */
export interface CostBreakdown {
  laborCost: number;
  materialCost: number;
  travelCost: number;
  totalCost: number;
}

/** Customer ranking item for dashboard. */
export interface CustomerRankingItem {
  customerId: number;
  customerName: string;
  totalAmount: number;
  orderCount: number;
}

/** Table stat item for dashboard. */
export interface TableStatItem {
  tableName: string;
  displayName: string;
  recordCount: number;
}

/** Aggregated dashboard data. */
export interface DashboardData {
  overview: OverviewSummary;
  monthlyTrend: MonthlyTrendItem[];
  costBreakdown: CostBreakdown;
  customerRanking: CustomerRankingItem[];
  tableStats: TableStatItem[];
}
