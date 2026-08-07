/**
 * Work order detail page.
 * Displays full work order info with edit and back actions.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  Button,
  Box,
  CircularProgress,
  Switch,
  FormControlLabel,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import PageHeader from '../components/common/PageHeader';
import WorkOrderDetail from '../components/workOrder/WorkOrderDetail';
import { getWorkOrderById, updatePaymentStatus } from '../api/workOrder.api';
import { usePermission } from '../hooks/usePermission';
import { useSnackbar } from 'notistack';
import type { WorkOrder } from '../types';

/**
 * Work order detail page with edit and payment status management.
 */
const WorkOrderDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = usePermission();
  const { enqueueSnackbar } = useSnackbar();

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const loadWorkOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getWorkOrderById(parseInt(id, 10));
      setWorkOrder(data);
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : '加载失败', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [id, enqueueSnackbar]);

  useEffect(() => {
    loadWorkOrder();
  }, [loadWorkOrder]);

  /** Toggles payment status. */
  const handleTogglePayment = async () => {
    if (!workOrder) return;
    setPaymentLoading(true);
    try {
      const updated = await updatePaymentStatus(workOrder.id, !workOrder.isPaid);
      setWorkOrder(updated);
      enqueueSnackbar('结款状态更新成功', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : '操作失败', { variant: 'error' });
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!workOrder) {
    return (
      <Box>
        <PageHeader title="工单详情" />
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            工单不存在
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="工单详情"
        actions={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/work-orders')}
            >
              返回列表
            </Button>
            {hasPermission('workorder:update') && (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/work-orders/${workOrder.id}/edit`)}
              >
                编辑
              </Button>
            )}
          </Box>
        }
      />

      <Card>
        <CardContent>
          <WorkOrderDetail workOrder={workOrder} />

          {hasPermission('payment:manage') && (
            <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={workOrder.isPaid}
                    onChange={handleTogglePayment}
                    color="success"
                    disabled={paymentLoading}
                  />
                }
                label={workOrder.isPaid ? '已结款' : '未结款'}
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default WorkOrderDetailPage;
