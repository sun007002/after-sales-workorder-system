/**
 * Shared type definitions for the backend.
 * These types mirror the frontend types for API contract consistency.
 */
import { Request } from 'express';

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
  | 'role:manage'
  | 'settings:manage'
  | 'salescontract:read'
  | 'salescontract:create'
  | 'salescontract:update'
  | 'salescontract:delete'
  | 'purchasecontract:read'
  | 'purchasecontract:create'
  | 'purchasecontract:update'
  | 'purchasecontract:delete'
  | 'invoice:read'
  | 'invoice:create'
  | 'invoice:update'
  | 'invoice:delete';

/** Staff names separator (Chinese enumeration comma). */
export const STAFF_NAMES_SEPARATOR = '、';

/** Work order DTO returned by API. */
export interface WorkOrderDTO {
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

/** User DTO returned by API (no password hash). */
export interface UserDTO {
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

/** Authenticated user info attached to req.user by auth middleware. */
export interface AuthUser {
  userId: number;
  roleId: number;
  username: string;
  displayName: string;
  permissions: string[];
}

/** Extended Express Request with user context. */
export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

/** Login request body. */
export interface LoginBody {
  username: string;
  password: string;
}

/** Change password request body. */
export interface ChangePasswordBody {
  oldPassword: string;
  newPassword: string;
}

/** Work order list query parameters. */
export interface WorkOrderQuery {
  page?: string;
  pageSize?: string;
  keyword?: string;
  customerId?: string;
  staffName?: string;
  isPaid?: string;
  startDate?: string;
  endDate?: string;
}

/** Composite summary query parameters. */
export interface CompositeQuery {
  customerIds?: string;
  startDate?: string;
  endDate?: string;
  isPaid?: string;
}

// ========== FEAT-3: Work Order File DTO ==========

/** Work order file DTO returned by API. */
export interface WorkOrderFileDTO {
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

/** Overview summary data (reused from summary.service.ts). */
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

/** Aggregated dashboard data returned by GET /api/summary/dashboard. */
export interface DashboardData {
  overview: OverviewSummary;
  monthlyTrend: MonthlyTrendItem[];
  costBreakdown: CostBreakdown;
  customerRanking: CustomerRankingItem[];
  tableStats: TableStatItem[];
  businessSummary?: BusinessSummary;
}

// ========== Business Entity ==========

/** Business entity DTO. */
export interface BusinessEntityDTO {
  id: number;
  name: string;
  code: string;
  taxNumber: string | null;
  address: string | null;
  bankAccount: string | null;
  phone: string | null;
  status: string;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
}

// ========== Sales Contract ==========

/** Sales contract DTO. */
export interface SalesContractDTO {
  id: number;
  contractNo: string;
  businessEntityId: number;
  businessEntityName: string;
  customerName: string;
  title: string;
  amount: number;
  signedAt: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
  description: string | null;
  createdBy: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

// ========== Purchase Contract ==========

/** Purchase contract DTO. */
export interface PurchaseContractDTO {
  id: number;
  contractNo: string;
  businessEntityId: number;
  businessEntityName: string;
  supplier: string;
  title: string;
  amount: number;
  signedAt: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
  description: string | null;
  createdBy: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

// ========== Invoice ==========

/** Invoice DTO. */
export interface InvoiceDTO {
  id: number;
  invoiceNo: string;
  businessEntityId: number | null;
  businessEntityName: string | null;
  contractType: string | null;
  contractId: number | null;
  invoiceType: string;
  amount: number;
  taxRate: number;
  taxAmount: number | null;
  invoiceDate: string;
  status: string;
  fileUrl: string | null;
  description: string | null;
  createdBy: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

/** Invoice file DTO. */
export interface InvoiceFileDTO {
  id: number;
  invoiceId: number;
  fileName: string;
  originalName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadedBy: number;
  uploadedByName: string;
  createdAt: string;
}

// ========== Business Summary (Dashboard) ==========

/** Business summary stats for dashboard. */
export interface BusinessSummary {
  salesTotal: number;
  salesCount: number;
  purchaseTotal: number;
  purchaseCount: number;
  invoiceTotal: number;
  invoiceCount: number;
}
