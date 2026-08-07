/**
 * Dashboard page (v2 redesign).
 * Layout: 4 metric cards (top) + 4 chart panels (2x2 grid below).
 * Uses the aggregated /api/summary/dashboard endpoint for all data.
 *
 * Includes a year/month date range filter (DatePicker) that controls
 * the time window for overview, cost breakdown, monthly trend, and
 * customer ranking queries. Defaults to the current calendar year.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Button,
  Box,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import AddIcon from '@mui/icons-material/Add';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import StatCard from '../components/common/StatCard';
import PageHeader from '../components/common/PageHeader';
import MonthlyTrendChart from '../components/dashboard/MonthlyTrendChart';
import CostBreakdownChart from '../components/dashboard/CostBreakdownChart';
import CustomerRankingChart from '../components/dashboard/CustomerRankingChart';
import TableStatusTable from '../components/dashboard/TableStatusTable';
import { getDashboard } from '../api/summary.api';
import { formatCurrency } from '../utils/format';
import { usePermission } from '../hooks/usePermission';
import type { DashboardData } from '../types';

/**
 * Converts a Date to the ISO string of the first day of that month.
 * @param date - The source date.
 * @returns ISO string for the first moment of the month.
 */
function toMonthStartISO(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
}

/**
 * Converts a Date to the ISO string of the last moment of that month.
 * @param date - The source date.
 * @returns ISO string for the final moment of the month.
 */
function toMonthEndISO(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
}

/**
 * Dashboard with 4 metric cards + 4 chart panels and a date range filter.
 */
const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Default date range: current calendar year (Jan 1 – Dec 31).
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState<Date>(new Date(currentYear, 0, 1));
  const [endDate, setEndDate] = useState<Date>(new Date(currentYear, 11, 31));

  const loadData = useCallback(async () => {
    if (!hasPermission('summary:view')) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getDashboard({
        startDate: toMonthStartISO(startDate),
        endDate: toMonthEndISO(endDate),
      });
      setDashboardData(data);
    } catch {
      // Error handled by axios interceptor.
    } finally {
      setLoading(false);
    }
  }, [hasPermission, startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /** Resets the date range to the current calendar year. */
  const handleReset = () => {
    const year = new Date().getFullYear();
    setStartDate(new Date(year, 0, 1));
    setEndDate(new Date(year, 11, 31));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const overview = dashboardData?.overview;

  return (
    <Box>
      <PageHeader
        title="仪表盘"
        subtitle="关键指标总览"
        actions={
          hasPermission('workorder:create') && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/work-orders/new')}
            >
              新建工单
            </Button>
          )
        }
      />

      {/* Date range filter row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <DatePicker
          views={['year', 'month']}
          label="开始"
          value={dayjs(startDate)}
          onChange={(newValue) => {
            if (newValue) setStartDate(newValue.toDate());
          }}
          slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
        />
        <DatePicker
          views={['year', 'month']}
          label="结束"
          value={dayjs(endDate)}
          onChange={(newValue) => {
            if (newValue) setEndDate(newValue.toDate());
          }}
          slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
        />
        <Button
          variant="outlined"
          size="small"
          startIcon={<RestartAltIcon />}
          onClick={handleReset}
        >
          重置
        </Button>
      </Box>

      {/* 4 metric cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="工单总数"
            value={overview?.totalOrders ?? 0}
            subValue={
              overview
                ? `已结款 ${overview.paidOrderCount} / 未结款 ${overview.unpaidOrderCount}`
                : undefined
            }
            icon={<AssignmentIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="工单总金额"
            value={formatCurrency(overview?.totalAmount)}
            icon={<AttachMoneyIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="已结款金额"
            value={formatCurrency(overview?.paidAmount)}
            subValue={
              overview ? `已结款 ${overview.paidOrderCount} 笔` : undefined
            }
            icon={<CheckCircleIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="未结款金额"
            value={formatCurrency(overview?.unpaidAmount)}
            subValue={
              overview ? `未结款 ${overview.unpaidOrderCount} 笔` : undefined
            }
            icon={<MoneyOffIcon />}
            color="error"
          />
        </Grid>
      </Grid>

      {/* 2x2 chart grid */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <MonthlyTrendChart data={dashboardData?.monthlyTrend ?? []} />
        </Grid>
        <Grid item xs={12} md={6}>
          <CostBreakdownChart data={dashboardData?.costBreakdown ?? { laborCost: 0, materialCost: 0, travelCost: 0, totalCost: 0 }} />
        </Grid>
        <Grid item xs={12} md={6}>
          <CustomerRankingChart data={dashboardData?.customerRanking ?? []} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TableStatusTable data={dashboardData?.tableStats ?? []} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
