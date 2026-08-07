/**
 * Work order list page.
 * PC table + mobile card list with search, filters, and pagination.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Grid,
  TextField,
  MenuItem,
  Pagination,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PageHeader from '../components/common/PageHeader';
import WorkOrderTable from '../components/workOrder/WorkOrderTable';
import WorkOrderMobileList from '../components/workOrder/WorkOrderMobileList';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { getWorkOrders, deleteWorkOrder } from '../api/workOrder.api';
import { getCustomerList } from '../api/customer.api';
import { getStaffList } from '../api/staff.api';
import { usePermission } from '../hooks/usePermission';
import { useSnackbar } from 'notistack';
import type { WorkOrder, Customer, Staff, PaginatedData } from '../types';
import { DEFAULT_PAGE_SIZE } from '../utils/constants';

/**
 * Work order list page with search, filters, and responsive layout.
 */
const WorkOrderListPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { hasPermission } = usePermission();
  const { enqueueSnackbar } = useSnackbar();
  const [searchParams] = useSearchParams();

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [keyword, setKeyword] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [staffName, setStaffName] = useState('');
  const [isPaid, setIsPaid] = useState<string>(searchParams.get('isPaid') || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Data for filters
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /** Loads filter data (customers and staff). */
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [customerData, staffData] = await Promise.all([
          getCustomerList('active'),
          getStaffList('active'),
        ]);
        setCustomers(customerData);
        setStaffList(staffData);
      } catch {
        // Error handled by interceptor.
      }
    };
    loadFilters();
  }, []);

  /** Loads work orders with current filters. */
  const loadWorkOrders = useCallback(async () => {
    setLoading(true);
    try {
      const result: PaginatedData<WorkOrder> = await getWorkOrders({
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        keyword: keyword || undefined,
        customerId: customerId ? parseInt(customerId, 10) : undefined,
        staffName: staffName || undefined,
        isPaid: isPaid !== '' ? isPaid : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setWorkOrders(result.items);
      setTotal(result.total);
    } catch {
      // Error handled by interceptor.
    } finally {
      setLoading(false);
    }
  }, [page, keyword, customerId, staffName, isPaid, startDate, endDate]);

  useEffect(() => {
    loadWorkOrders();
  }, [loadWorkOrders]);

  /** Handles search button click - resets to page 1. */
  const handleSearch = () => {
    setPage(1);
    loadWorkOrders();
  };

  /** Handles delete confirmation. */
  const handleDelete = async () => {
    if (deleteId === null) return;
    setDeleteLoading(true);
    try {
      await deleteWorkOrder(deleteId);
      enqueueSnackbar('工单删除成功', { variant: 'success' });
      setDeleteId(null);
      loadWorkOrders();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : '删除失败', { variant: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalPages = Math.ceil(total / DEFAULT_PAGE_SIZE);

  return (
    <Box>
      <PageHeader
        title="工单管理"
        subtitle={`共 ${total} 条记录`}
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

      {/* Filter bar */}
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="搜索（工单编号/客户名称）"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              select
              size="small"
              label="客户"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <MenuItem value="">全部</MenuItem>
              {customers.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              select
              size="small"
              label="售后人员"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
            >
              <MenuItem value="">全部</MenuItem>
              {staffList.map((s) => (
                <MenuItem key={s.id} value={s.name}>{s.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} md={1.5}>
            <TextField
              fullWidth
              select
              size="small"
              label="结款状态"
              value={isPaid}
              onChange={(e) => setIsPaid(e.target.value)}
            >
              <MenuItem value="">全部</MenuItem>
              <MenuItem value="true">已结款</MenuItem>
              <MenuItem value="false">未结款</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} md={1.5}>
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
          <Grid item xs={6} md={1.5}>
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
          <Grid item xs={6} md={1}>
            <Button fullWidth variant="contained" onClick={handleSearch} size="small">
              查询
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Work order list */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : isMobile ? (
        <WorkOrderMobileList
          workOrders={workOrders}
          onView={(id) => navigate(`/work-orders/${id}`)}
          onEdit={(id) => navigate(`/work-orders/${id}/edit`)}
          onDelete={(id) => setDeleteId(id)}
          canEdit={hasPermission('workorder:update')}
          canDelete={hasPermission('workorder:delete')}
        />
      ) : (
        <WorkOrderTable
          workOrders={workOrders}
          onView={(id) => navigate(`/work-orders/${id}`)}
          onEdit={(id) => navigate(`/work-orders/${id}/edit`)}
          onDelete={(id) => setDeleteId(id)}
          canEdit={hasPermission('workorder:update')}
          canDelete={hasPermission('workorder:delete')}
          canManagePayment={hasPermission('payment:manage')}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_e, p) => setPage(p)}
            color="primary"
            size={isMobile ? 'small' : 'medium'}
          />
        </Box>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteId !== null}
        title="删除工单"
        message="确定要删除此工单吗？删除后不可恢复。"
        confirmText="删除"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
};

export default WorkOrderListPage;
