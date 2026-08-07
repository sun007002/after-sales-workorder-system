/**
 * Summary query service.
 * Provides aggregate statistics: overview, composite query, staff summary, and dashboard data.
 */
import { Prisma } from '@prisma/client';
import ExcelJS from 'exceljs';
import prisma from '../utils/prisma';
import {
  AuthUser,
  CompositeQuery,
  OverviewSummary,
  DashboardData,
  MonthlyTrendItem,
  CostBreakdown,
  CustomerRankingItem,
  TableStatItem,
} from '../types';
import { isEngineerRole } from '../middleware/rbac';

/** Composite query result. */
export interface CompositeResult {
  items: Array<{
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
  }>;
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

/** Dashboard query parameters (optional date range filter). */
export interface DashboardQuery {
  startDate?: string;
  endDate?: string;
}

/**
 * Builds the base where clause for work order queries with data-level permissions.
 */
function buildBaseWhere(authUser: AuthUser): Prisma.WorkOrderWhereInput {
  const where: Prisma.WorkOrderWhereInput = { isDeleted: false };
  if (isEngineerRole({ user: authUser } as never)) {
    where.staffNames = { contains: authUser.displayName };
  }
  return where;
}

/**
 * Retrieves the overall summary statistics.
 * @param authUser - The authenticated user for data-level permissions.
 * @returns Overview summary data.
 */
export async function getOverview(authUser: AuthUser): Promise<OverviewSummary> {
  const baseWhere = buildBaseWhere(authUser);

  // Aggregate all work orders.
  const allAgg = await prisma.workOrder.aggregate({
    where: baseWhere,
    _count: true,
    _sum: {
      laborCost: true,
      materialCost: true,
      travelCost: true,
      totalAmount: true,
    },
  });

  // Aggregate paid work orders.
  const paidAgg = await prisma.workOrder.aggregate({
    where: { ...baseWhere, isPaid: true },
    _count: true,
    _sum: { totalAmount: true },
  });

  // Aggregate unpaid work orders.
  const unpaidAgg = await prisma.workOrder.aggregate({
    where: { ...baseWhere, isPaid: false },
    _count: true,
    _sum: { totalAmount: true },
  });

  return {
    totalOrders: allAgg._count,
    totalLaborCost: Number(allAgg._sum.laborCost || 0),
    totalMaterialCost: Number(allAgg._sum.materialCost || 0),
    totalTravelCost: Number(allAgg._sum.travelCost || 0),
    totalAmount: Number(allAgg._sum.totalAmount || 0),
    paidOrderCount: paidAgg._count,
    paidAmount: Number(paidAgg._sum.totalAmount || 0),
    unpaidOrderCount: unpaidAgg._count,
    unpaidAmount: Number(unpaidAgg._sum.totalAmount || 0),
  };
}

/**
 * Performs a composite query with multiple filters.
 * @param query - The composite query parameters.
 * @param authUser - The authenticated user for data-level permissions.
 * @returns Composite query result with items, summary, and total count.
 */
export async function getComposite(
  query: CompositeQuery,
  authUser: AuthUser,
): Promise<CompositeResult> {
  const where: Prisma.WorkOrderWhereInput = buildBaseWhere(authUser);

  // Filter by customer IDs.
  if (query.customerIds) {
    const customerIds = query.customerIds
      .split(',')
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id));
    if (customerIds.length > 0) {
      where.customerId = { in: customerIds };
    }
  }

  // Filter by date range (based on startTime — service start time).
  if (query.startDate || query.endDate) {
    where.startTime = {};
    if (query.startDate) {
      where.startTime.gte = new Date(query.startDate);
    }
    if (query.endDate) {
      where.startTime.lte = new Date(query.endDate);
    }
  }

  // Filter by payment status.
  if (query.isPaid !== undefined && query.isPaid !== '') {
    where.isPaid = query.isPaid === 'true';
  }

  // Get total count (before limit).
  const totalCount = await prisma.workOrder.count({ where });

  // Get items (max 50).
  const workOrders = await prisma.workOrder.findMany({
    where,
    include: {
      customer: { select: { name: true } },
      contact: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  // Calculate summary from ALL matching records (not just the 50 displayed).
  const agg = await prisma.workOrder.aggregate({
    where,
    _count: true,
    _sum: {
      laborCost: true,
      materialCost: true,
      travelCost: true,
      totalAmount: true,
    },
  });

  // Calculate unpaid amount from matching records.
  const unpaidAgg = await prisma.workOrder.aggregate({
    where: { ...where, isPaid: false },
    _sum: { totalAmount: true },
  });

  const items = workOrders.map((wo) => ({
    id: wo.id,
    orderNo: wo.orderNo,
    customerName: wo.customer.name,
    contactName: wo.contact.name,
    contactPhone: wo.contactPhone,
    staffNames: wo.staffNames,
    description: wo.description,
    laborCost: Number(wo.laborCost),
    materialCost: Number(wo.materialCost),
    travelCost: Number(wo.travelCost),
    totalAmount: Number(wo.totalAmount),
    isPaid: wo.isPaid,
    createdAt: wo.createdAt.toISOString(),
    startTime: wo.startTime?.toISOString() ?? null,
  }));

  return {
    items,
    summary: {
      count: agg._count,
      totalLaborCost: Number(agg._sum.laborCost || 0),
      totalMaterialCost: Number(agg._sum.materialCost || 0),
      totalTravelCost: Number(agg._sum.travelCost || 0),
      totalAmount: Number(agg._sum.totalAmount || 0),
      unpaidAmount: Number(unpaidAgg._sum.totalAmount || 0),
    },
    totalCount,
  };
}

/**
 * Exports the composite query result as an Excel (.xlsx) Buffer.
 * Contains two sheets: "汇总" (summary metrics) and "明细" (detail rows).
 * @param query - The composite query parameters.
 * @param authUser - The authenticated user for data-level permissions.
 * @returns Buffer containing the .xlsx file.
 */
export async function exportComposite(
  query: CompositeQuery,
  authUser: AuthUser,
): Promise<Buffer> {
  const result = await getComposite(query, authUser);

  const workbook = new ExcelJS.Workbook();

  // Sheet 1: 汇总
  const summarySheet = workbook.addWorksheet('汇总');
  summarySheet.columns = [
    { header: '指标', key: 'label', width: 20 },
    { header: '金额', key: 'value', width: 20 },
  ];
  summarySheet.addRows([
    { label: '合计金额', value: result.summary.totalAmount },
    { label: '未结款金额', value: result.summary.unpaidAmount },
    { label: '工单数', value: result.summary.count },
    { label: '人工费合计', value: result.summary.totalLaborCost },
    { label: '材料费合计', value: result.summary.totalMaterialCost },
    { label: '差旅费合计', value: result.summary.totalTravelCost },
  ]);
  // Style header row.
  summarySheet.getRow(1).font = { bold: true };
  // Number format for the value column (except 工单数 is integer).
  summarySheet.getColumn('value').numFmt = '#,##0.00';
  // Make 工单数 integer.
  summarySheet.getCell('B4').numFmt = '0';

  // Sheet 2: 明细
  const detailSheet = workbook.addWorksheet('明细');
  detailSheet.columns = [
    { header: '工单编号', key: 'orderNo', width: 16 },
    { header: '客户名称', key: 'customerName', width: 20 },
    { header: '联系人', key: 'contactName', width: 12 },
    { header: '联系电话', key: 'contactPhone', width: 16 },
    { header: '录入时间', key: 'createdAt', width: 22 },
    { header: '开始日期', key: 'startDate', width: 14 },
    { header: '人工费', key: 'laborCost', width: 12 },
    { header: '材料费', key: 'materialCost', width: 12 },
    { header: '差旅费', key: 'travelCost', width: 12 },
    { header: '合计金额', key: 'totalAmount', width: 14 },
    { header: '结款状态', key: 'paidStatus', width: 12 },
    { header: '描述', key: 'description', width: 30 },
    { header: '售后人员', key: 'staffNames', width: 16 },
  ];

  for (const item of result.items) {
    detailSheet.addRow({
      orderNo: item.orderNo,
      customerName: item.customerName,
      contactName: item.contactName,
      contactPhone: item.contactPhone ?? '',
      createdAt: item.createdAt,
      startDate: item.startTime ? item.startTime.slice(0, 10) : '',
      laborCost: item.laborCost,
      materialCost: item.materialCost,
      travelCost: item.travelCost,
      totalAmount: item.totalAmount,
      paidStatus: item.isPaid ? '已结款' : '未结款',
      description: item.description,
      staffNames: item.staffNames,
    });
  }

  // Style header row.
  detailSheet.getRow(1).font = { bold: true };
  // Number format for money columns.
  const moneyCols = ['G', 'H', 'I', 'J']; // laborCost, materialCost, travelCost, totalAmount
  for (const col of moneyCols) {
    detailSheet.getColumn(col).numFmt = '#,##0.00';
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

/**
 * Retrieves per-staff summary statistics.
 * For each active staff member, counts work orders they participate in
 * and sums the amounts.
 * @returns Array of staff summary items.
 */
export async function getStaffSummary(): Promise<StaffSummaryItem[]> {
  const staffList = await prisma.afterSalesStaff.findMany({
    where: { status: 'active' },
    orderBy: { name: 'asc' },
  });

  const results: StaffSummaryItem[] = [];

  for (const staff of staffList) {
    const where: Prisma.WorkOrderWhereInput = {
      isDeleted: false,
      staffNames: { contains: staff.name },
    };

    const [agg, unpaidAgg] = await Promise.all([
      prisma.workOrder.aggregate({
        where,
        _count: true,
        _sum: { totalAmount: true },
      }),
      prisma.workOrder.aggregate({
        where: { ...where, isPaid: false },
        _sum: { totalAmount: true },
      }),
    ]);

    results.push({
      staffId: staff.id,
      staffName: staff.name,
      orderCount: agg._count,
      totalAmount: Number(agg._sum.totalAmount || 0),
      unpaidAmount: Number(unpaidAgg._sum.totalAmount || 0),
    });
  }

  return results;
}

/**
 * Generates an array of "YYYY-MM" month strings between the given dates
 * (inclusive). Falls back to the last 12 months when either date is absent.
 * @param startDate - Optional start date (month boundary).
 * @param endDate - Optional end date (month boundary).
 * @returns Array of month strings.
 */
function generateMonthsBetween(startDate?: Date, endDate?: Date): string[] {
  if (!startDate || !endDate) {
    // Fallback: last 12 months (backward compatibility).
    const months: string[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      months.push(`${year}-${month}`);
    }
    return months;
  }

  const months: string[] = [];
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  const current = new Date(start);
  while (current <= end) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    months.push(`${year}-${month}`);
    current.setMonth(current.getMonth() + 1);
  }
  return months;
}

/**
 * Retrieves the dashboard aggregate data in a single request.
 * Runs 5 parallel queries: overview, monthly trend, cost breakdown,
 * customer ranking, and table stats.
 *
 * The optional `query` parameter filters overview, cost breakdown,
 * monthly trend, and customer ranking by a created_at date range.
 * Table stats are NOT affected by the date filter.
 *
 * @param authUser - The authenticated user for data-level permissions.
 * @param query - Optional date range filter (startDate / endDate as ISO strings).
 * @returns Dashboard data with all chart data.
 */
export async function getDashboardData(
  authUser: AuthUser,
  query?: DashboardQuery,
): Promise<DashboardData> {
  const baseWhere = buildBaseWhere(authUser);

  // Build date-filtered where clause for Prisma aggregate queries.
  const fullWhere: Prisma.WorkOrderWhereInput = { ...baseWhere };
  if (query?.startDate || query?.endDate) {
    fullWhere.startTime = {};
    if (query?.startDate) {
      fullWhere.startTime.gte = new Date(query.startDate);
    }
    if (query?.endDate) {
      fullWhere.startTime.lte = new Date(query.endDate);
    }
  }

  // Build date filter fragments for raw SQL (parameterized via Prisma.sql).
  const monthlyStartSql = query?.startDate
    ? Prisma.sql`AND start_time >= ${query.startDate}`
    : Prisma.empty;
  const monthlyEndSql = query?.endDate
    ? Prisma.sql`AND start_time <= ${query.endDate}`
    : Prisma.empty;
  const customerStartSql = query?.startDate
    ? Prisma.sql`AND w.start_time >= ${query.startDate}`
    : Prisma.empty;
  const customerEndSql = query?.endDate
    ? Prisma.sql`AND w.start_time <= ${query.endDate}`
    : Prisma.empty;

  // Determine the months range for the monthly trend zero-fill.
  const monthsList = generateMonthsBetween(
    query?.startDate ? new Date(query.startDate) : undefined,
    query?.endDate ? new Date(query.endDate) : undefined,
  );

  // Run all 5 groups of queries in parallel.
  const [
    overviewResult,
    monthlyRawData,
    costAgg,
    customerRawData,
    tableStatsResult,
  ] = await Promise.all([
    // 1. Overview: count + sum (3 queries in parallel, using fullWhere)
    Promise.all([
      prisma.workOrder.aggregate({
        where: fullWhere,
        _count: true,
        _sum: {
          laborCost: true,
          materialCost: true,
          travelCost: true,
          totalAmount: true,
        },
      }),
      prisma.workOrder.aggregate({
        where: { ...fullWhere, isPaid: true },
        _count: true,
        _sum: { totalAmount: true },
      }),
      prisma.workOrder.aggregate({
        where: { ...fullWhere, isPaid: false },
        _count: true,
        _sum: { totalAmount: true },
      }),
    ]),

    // 2. Monthly trend: group by month (raw SQL, filtered by date range)
    prisma.$queryRaw<Array<{ month: string; amount: number; count: bigint }>>(
      Prisma.sql`
        SELECT 
          DATE_FORMAT(start_time, '%Y-%m') AS month,
          COALESCE(SUM(total_amount), 0) AS amount,
          COUNT(*) AS count
        FROM work_orders
        WHERE is_deleted = false
          ${isEngineerRole({ user: authUser } as never) 
            ? Prisma.sql`AND staff_names LIKE ${`%${authUser.displayName}%`}`
            : Prisma.empty}
          ${monthlyStartSql}
          ${monthlyEndSql}
        GROUP BY DATE_FORMAT(start_time, '%Y-%m')
        ORDER BY month ASC
      `,
    ),

    // 3. Cost breakdown: sum of three cost fields (using fullWhere)
    prisma.workOrder.aggregate({
      where: fullWhere,
      _sum: {
        laborCost: true,
        materialCost: true,
        travelCost: true,
      },
    }),

    // 4. Customer ranking: top 10 by total amount (raw SQL, filtered by date range)
    prisma.$queryRaw<Array<{ customerId: number; customerName: string; totalAmount: number; orderCount: bigint }>>(
      Prisma.sql`
        SELECT 
          w.customer_id AS customerId,
          c.name AS customerName,
          COALESCE(SUM(w.total_amount), 0) AS totalAmount,
          COUNT(*) AS orderCount
        FROM work_orders w
        JOIN customers c ON w.customer_id = c.id
        WHERE w.is_deleted = false
          ${isEngineerRole({ user: authUser } as never)
            ? Prisma.sql`AND w.staff_names LIKE ${`%${authUser.displayName}%`}`
            : Prisma.empty}
          ${customerStartSql}
          ${customerEndSql}
        GROUP BY w.customer_id, c.name
        ORDER BY totalAmount DESC
        LIMIT 10
      `,
    ),

    // 5. Table stats: count records in each table (NOT affected by date filter)
    Promise.all([
      prisma.workOrder.count({ where: { isDeleted: false } }),
      prisma.customer.count(),
      prisma.customerContact.count(),
      prisma.afterSalesStaff.count(),
      prisma.user.count(),
      prisma.role.count(),
      prisma.operationLog.count(),
    ]),
  ]);

  // Build overview from aggregated results.
  const [allAgg, paidAgg, unpaidAgg] = overviewResult;
  const overview: OverviewSummary = {
    totalOrders: allAgg._count,
    totalLaborCost: Number(allAgg._sum.laborCost || 0),
    totalMaterialCost: Number(allAgg._sum.materialCost || 0),
    totalTravelCost: Number(allAgg._sum.travelCost || 0),
    totalAmount: Number(allAgg._sum.totalAmount || 0),
    paidOrderCount: paidAgg._count,
    paidAmount: Number(paidAgg._sum.totalAmount || 0),
    unpaidOrderCount: unpaidAgg._count,
    unpaidAmount: Number(unpaidAgg._sum.totalAmount || 0),
  };

  // Build monthly trend with zero-fill for missing months.
  const monthlyMap = new Map<string, { amount: number; count: number }>();
  for (const row of monthlyRawData) {
    monthlyMap.set(row.month, {
      amount: Number(row.amount),
      count: Number(row.count),
    });
  }
  const monthlyTrend: MonthlyTrendItem[] = monthsList.map((month) => {
    const data = monthlyMap.get(month);
    return {
      month,
      amount: data ? data.amount : 0,
      count: data ? data.count : 0,
    };
  });

  // Build cost breakdown.
  const costBreakdown: CostBreakdown = {
    laborCost: Number(costAgg._sum.laborCost || 0),
    materialCost: Number(costAgg._sum.materialCost || 0),
    travelCost: Number(costAgg._sum.travelCost || 0),
    totalCost:
      Number(costAgg._sum.laborCost || 0) +
      Number(costAgg._sum.materialCost || 0) +
      Number(costAgg._sum.travelCost || 0),
  };

  // Build customer ranking.
  const customerRanking: CustomerRankingItem[] = customerRawData.map((row) => ({
    customerId: row.customerId,
    customerName: row.customerName,
    totalAmount: Number(row.totalAmount),
    orderCount: Number(row.orderCount),
  }));

  // Build table stats.
  const [
    workOrderCount,
    customerCount,
    contactCount,
    staffCount,
    userCount,
    roleCount,
    logCount,
  ] = tableStatsResult;
  const tableStats: TableStatItem[] = [
    { tableName: 'work_orders', displayName: '工单表', recordCount: workOrderCount },
    { tableName: 'customers', displayName: '客户表', recordCount: customerCount },
    { tableName: 'customer_contacts', displayName: '客户联系人表', recordCount: contactCount },
    { tableName: 'after_sales_staff', displayName: '售后人员表', recordCount: staffCount },
    { tableName: 'users', displayName: '用户表', recordCount: userCount },
    { tableName: 'roles', displayName: '角色表', recordCount: roleCount },
    { tableName: 'operation_logs', displayName: '操作日志表', recordCount: logCount },
  ];

  return {
    overview,
    monthlyTrend,
    costBreakdown,
    customerRanking,
    tableStats,
  };
}
