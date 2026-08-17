/**
 * SummaryPage - Summary query page.
 * Displays overview metrics, composite query results, and per-staff summary.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Button,
  TextField,
  MenuItem,
  Chip,
  Typography,
  CircularProgress,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BuildIcon from '@mui/icons-material/Build';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import StatCard from '../components/common/StatCard';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import { getOverview, getComposite, getStaffSummary, exportComposite, type CompositeQueryParams } from '../api/summary.api';
import { getCustomerList } from '../api/customer.api';
import { usePermission } from '../hooks/usePermission';
import { useSnackbar } from 'notistack';
import { formatCurrency, formatDateTime, formatDate } from '../utils/format';
import { useUnpaidColors } from '../utils/constants';
import { useTheme } from '@mui/material/styles';
import type {
  OverviewSummary,
  CompositeResult,
  StaffSummaryItem,
  Customer,
} from '../types';

/**
 * Summary query page with three sections: overview, composite query, and staff summary.
 */
const SummaryPage: React.FC = () => {
  const { hasPermission } = usePermission();
  const { enqueueSnackbar } = useSnackbar();
  const { bg: unpaidBg } = useUnpaidColors();
  const theme = useTheme();

  const [overview, setOverview] = useState<OverviewSummary | null>(null);
  const [composite, setComposite] = useState<CompositeResult | null>(null);
  const [staffSummary, setStaffSummary] = useState<StaffSummaryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryLoading, setQueryLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Composite query filter state
  const [customerId, setCustomerId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isPaid, setIsPaid] = useState('');

  /** Loads overview, staff summary, and customer list on mount. */
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewData, staffData, customerData] = await Promise.all([
        getOverview(),
        getStaffSummary(),
        getCustomerList(),
      ]);
      setOverview(overviewData);
      setStaffSummary(staffData);
      setCustomers(customerData);
    } catch {
      // Error handled by interceptor.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  /** Executes composite query with current filter values. */
  const handleQuery = useCallback(async () => {
    setQueryLoading(true);
    try {
      const params: CompositeQueryParams = {
        customerIds: customerId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        isPaid: isPaid || undefined,
      };
      const result = await getComposite(params);
      setComposite(result);
    } catch {
      // Error handled by interceptor.
    } finally {
      setQueryLoading(false);
    }
  }, [customerId, startDate, endDate, isPaid]);

  /** Exports the current composite query result as an Excel file. */
  const handleExport = useCallback(async () => {
    setExportLoading(true);
    try {
      const params: CompositeQueryParams = {
        customerIds: customerId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        isPaid: isPaid || undefined,
      };
      await exportComposite(params);
      enqueueSnackbar('Excel 导出成功', { variant: 'success' });
    } catch {
      enqueueSnackbar('Excel 导出失败', { variant: 'error' });
    } finally {
      setExportLoading(false);
    }
  }, [customerId, startDate, endDate, isPaid, enqueueSnackbar]);

  /** Escapes text for safe injection into the print document. */
  const escapeHtml = (value: unknown): string =>
    String(value ?? '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string),
    );

  /**
   * Exports the current composite query result as a PDF via the browser's
   * print dialog (Save as PDF). This renders Chinese text using system fonts,
   * avoiding embedded-font issues.
   */
  const handleExportPdf = useCallback(() => {
    if (!composite || composite.items.length === 0) {
      enqueueSnackbar('暂无可导出的数据', { variant: 'warning' });
      return;
    }

    const customerName = customerId
      ? customers.find((c) => String(c.id) === String(customerId))?.name ?? ''
      : '全部客户';
    const paidLabel = isPaid === 'true' ? '已结款' : isPaid === 'false' ? '未结款' : '全部';
    const dateRange =
      startDate || endDate ? `${startDate || '不限'} ~ ${endDate || '不限'}` : '全部';
    const exportedAt = formatDateTime(new Date().toISOString());

    const rows = composite.items
      .map(
        (item) => `
        <tr${item.isPaid ? '' : ' class="unpaid"'}>
          <td>${escapeHtml(item.orderNo)}</td>
          <td>${escapeHtml(item.customerName)}</td>
          <td>${escapeHtml(item.contactName)}</td>
          <td>${escapeHtml(item.staffNames)}</td>
          <td class="num">${escapeHtml(formatCurrency(item.laborCost))}</td>
          <td class="num">${escapeHtml(formatCurrency(item.materialCost))}</td>
          <td class="num">${escapeHtml(formatCurrency(item.travelCost))}</td>
          <td class="num b">${escapeHtml(formatCurrency(item.totalAmount))}</td>
          <td class="c">${item.isPaid ? '已结款' : '未结款'}</td>
          <td>${escapeHtml(formatDateTime(item.createdAt))}</td>
          <td>${escapeHtml(formatDate(item.startTime))}</td>
        </tr>`,
      )
      .join('');

    const summaryRow = `
      <tr class="sum">
        <td colspan="4">合计（${composite.summary.count} 单）</td>
        <td class="num">${escapeHtml(formatCurrency(composite.summary.totalLaborCost))}</td>
        <td class="num">${escapeHtml(formatCurrency(composite.summary.totalMaterialCost))}</td>
        <td class="num">${escapeHtml(formatCurrency(composite.summary.totalTravelCost))}</td>
        <td class="num b">${escapeHtml(formatCurrency(composite.summary.totalAmount))}</td>
        <td colspan="3">未结款：${escapeHtml(formatCurrency(composite.summary.unpaidAmount))}</td>
      </tr>`;

    const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<title>组合查询_${exportedAt.replace(/[^0-9]/g, '').slice(0, 12)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif; color: #1a1a1a; margin: 24px; }
  h1 { font-size: 18px; margin: 0 0 8px; }
  .meta { font-size: 12px; color: #555; margin-bottom: 12px; line-height: 1.6; }
  .meta span { margin-right: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th, td { border: 1px solid #bbb; padding: 4px 6px; text-align: left; }
  th { background: #f0f2f5; font-weight: 600; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.c { text-align: center; }
  td.b { font-weight: 700; }
  tr.unpaid td { background: #fff4f4; }
  tr.sum td { background: #eef1f5; font-weight: 700; }
  @media print { body { margin: 12mm; } }
</style>
</head>
<body>
  <h1>组合查询结果</h1>
  <div class="meta">
    <span>客户：${escapeHtml(customerName)}</span>
    <span>日期：${escapeHtml(dateRange)}</span>
    <span>结款状态：${escapeHtml(paidLabel)}</span>
    <span>导出时间：${escapeHtml(exportedAt)}</span>
  </div>
  <table>
    <thead>
      <tr>
        <th>工单编号</th><th>客户</th><th>联系人</th><th>售后人员</th>
        <th>人工费</th><th>材料费</th><th>交通差旅费</th><th>合计</th>
        <th>结款状态</th><th>录入时间</th><th>开始日期</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      ${summaryRow}
    </tbody>
  </table>
  <script>window.onload = function () { window.focus(); window.print(); };</script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (!win) {
      enqueueSnackbar('无法打开打印窗口，请检查浏览器弹窗拦截设置', { variant: 'error' });
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
  }, [composite, customerId, customers, isPaid, startDate, endDate, enqueueSnackbar]);

  /** Loads composite query on mount to show all data by default. */
  useEffect(() => {
    handleQuery();
  }, [handleQuery]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="汇总查询" subtitle="工单数据统计分析" />

      {/* Section A: Overview Summary Cards */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        总体汇总
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} md={4} lg={2}>
          <StatCard
            title="工单总数"
            value={overview?.totalOrders ?? 0}
            icon={<AssignmentIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={6} md={4} lg={2}>
          <StatCard
            title="人工费合计"
            value={formatCurrency(overview?.totalLaborCost)}
            icon={<BuildIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={6} md={4} lg={2}>
          <StatCard
            title="材料费合计"
            value={formatCurrency(overview?.totalMaterialCost)}
            icon={<BuildIcon />}
            color="default"
          />
        </Grid>
        <Grid item xs={6} md={4} lg={2}>
          <StatCard
            title="交通差旅费合计"
            value={formatCurrency(overview?.totalTravelCost)}
            icon={<DirectionsCarIcon />}
            color="default"
          />
        </Grid>
        <Grid item xs={6} md={4} lg={2}>
          <StatCard
            title="工单总金额"
            value={formatCurrency(overview?.totalAmount)}
            icon={<AttachMoneyIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={6} md={4} lg={2}>
          <StatCard
            title="已结款金额"
            value={formatCurrency(overview?.paidAmount)}
            subtitle={`已结款 ${overview?.paidOrderCount ?? 0} 单`}
            icon={<CheckCircleIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={6} md={4} lg={2}>
          <StatCard
            title="未结款金额"
            value={formatCurrency(overview?.unpaidAmount)}
            subtitle={`未结款 ${overview?.unpaidOrderCount ?? 0} 单`}
            icon={<MoneyOffIcon />}
            color="error"
          />
        </Grid>
      </Grid>

      {/* Section B: Composite Query */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        组合查询
      </Typography>
      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          {/* Filter bar */}
          <Grid container spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                size="small"
                label="客户名称"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <MenuItem value="">全部客户</MenuItem>
                {customers.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="开始日期"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="结束日期"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth
                select
                size="small"
                label="是否结款"
                value={isPaid}
                onChange={(e) => setIsPaid(e.target.value)}
              >
                <MenuItem value="">全部</MenuItem>
                <MenuItem value="true">已结款</MenuItem>
                <MenuItem value="false">未结款</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} md={1}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleQuery}
                size="small"
                disabled={queryLoading}
              >
                查询
              </Button>
            </Grid>
            <Grid item xs={6} md={1.5}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleExport}
                size="small"
                disabled={exportLoading}
              >
                {exportLoading ? '导出中...' : '导出 Excel'}
              </Button>
            </Grid>
            <Grid item xs={6} md={1.5}>
              <Button
                fullWidth
                variant="outlined"
                color="secondary"
                onClick={handleExportPdf}
                size="small"
              >
                导出 PDF
              </Button>
            </Grid>
          </Grid>

          {/* Query results table */}
          {queryLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : !composite || composite.items.length === 0 ? (
            <EmptyState message="暂无查询结果" description="请调整筛选条件后重新查询" />
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>工单编号</TableCell>
                    <TableCell>客户</TableCell>
                    <TableCell>联系人</TableCell>
                    <TableCell>售后人员</TableCell>
                    <TableCell align="right">人工费</TableCell>
                    <TableCell align="right">材料费</TableCell>
                    <TableCell align="right">交通差旅费</TableCell>
                    <TableCell align="right">合计</TableCell>
                    <TableCell align="center">结款状态</TableCell>
                    <TableCell>录入时间</TableCell>
                    <TableCell>开始日期</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {composite.items.map((item) => (
                    <TableRow
                      key={item.id}
                      sx={{ bgcolor: !item.isPaid ? unpaidBg : 'inherit' }}
                    >
                      <TableCell sx={{ fontWeight: 500 }}>{item.orderNo}</TableCell>
                      <TableCell>{item.customerName}</TableCell>
                      <TableCell>{item.contactName}</TableCell>
                      <TableCell>{item.staffNames}</TableCell>
                      <TableCell align="right">{formatCurrency(item.laborCost)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.materialCost)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.travelCost)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {formatCurrency(item.totalAmount)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={item.isPaid ? '已结款' : '未结款'}
                          size="small"
                          color={item.isPaid ? 'success' : 'error'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                      <TableCell>{formatDate(item.startTime)}</TableCell>
                    </TableRow>
                  ))}
                  {/* Summary row */}
                  <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100' }}>
                    <TableCell colSpan={4} sx={{ fontWeight: 700 }}>
                      合计（{composite.summary.count} 单）
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {formatCurrency(composite.summary.totalLaborCost)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {formatCurrency(composite.summary.totalMaterialCost)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {formatCurrency(composite.summary.totalTravelCost)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {formatCurrency(composite.summary.totalAmount)}
                    </TableCell>
                    <TableCell align="center" colSpan={3} sx={{ fontWeight: 700 }}>
                      未结款：{formatCurrency(composite.summary.unpaidAmount)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Section C: Staff Summary */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        各售后人员汇总
      </Typography>
      {staffSummary.length === 0 ? (
        <EmptyState message="暂无售后人员数据" />
      ) : (
        <TableContainer component={Card} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>售后人员</TableCell>
                <TableCell align="center">参与工单数</TableCell>
                <TableCell align="right">参与工单金额</TableCell>
                <TableCell align="right">未结款金额</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {staffSummary.map((staff) => (
                <TableRow key={staff.staffId} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{staff.staffName}</TableCell>
                  <TableCell align="center">{staff.orderCount}</TableCell>
                  <TableCell align="right">{formatCurrency(staff.totalAmount)}</TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 600,
                      color: staff.unpaidAmount > 0 ? 'error.main' : 'text.secondary',
                    }}
                  >
                    {formatCurrency(staff.unpaidAmount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default SummaryPage;
