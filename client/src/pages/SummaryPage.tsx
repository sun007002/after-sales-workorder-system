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
