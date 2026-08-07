/**
 * WorkOrderMobileList component.
 * Card-based list for mobile devices with key fields and action buttons.
 */
import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  IconButton,
  Stack,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { UNPAID_BG_COLOR, UNPAID_TEXT_COLOR } from '../../utils/constants';
import type { WorkOrder } from '../../types';

/** Props for WorkOrderMobileList. */
export interface WorkOrderMobileListProps {
  workOrders: WorkOrder[];
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  canEdit: boolean;
  canDelete: boolean;
}

/**
 * Mobile card list for work orders.
 */
const WorkOrderMobileList: React.FC<WorkOrderMobileListProps> = ({
  workOrders,
  onView,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}) => {
  if (workOrders.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
          暂无工单数据
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={1.5}>
      {workOrders.map((order) => (
        <Card
          key={order.id}
          onClick={() => onView(order.id)}
          sx={{
            cursor: 'pointer',
            bgcolor: !order.isPaid ? UNPAID_BG_COLOR : 'background.paper',
            border: !order.isPaid ? 1 : 0,
            borderColor: 'error.light',
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            {/* Header: order number + payment status */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: !order.isPaid ? UNPAID_TEXT_COLOR : 'primary.main' }}>
                {order.orderNo}
              </Typography>
              <Chip
                label={order.isPaid ? '已结款' : '未结款'}
                size="small"
                color={order.isPaid ? 'success' : 'error'}
                variant="outlined"
              />
            </Box>

            {/* Customer and contact */}
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
              {order.customerName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              联系人: {order.contactName} {order.contactPhone || ''}
            </Typography>

            {/* Staff */}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              售后人员: {order.staffNames}
            </Typography>

            {/* Start/End time */}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              开始时间: {formatDateTime(order.startTime)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              结束时间: {formatDateTime(order.endTime)}
            </Typography>

            {/* Amount */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: !order.isPaid ? UNPAID_TEXT_COLOR : 'text.primary' }}>
                {formatCurrency(order.totalAmount)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDateTime(order.createdAt)}
              </Typography>
            </Box>

            {/* Actions */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 1 }} onClick={(e) => e.stopPropagation()}>
              <IconButton size="small" onClick={() => onView(order.id)}>
                <VisibilityIcon fontSize="small" />
              </IconButton>
              {canEdit && (
                <IconButton size="small" onClick={() => onEdit(order.id)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              )}
              {canDelete && (
                <IconButton size="small" color="error" onClick={() => onDelete(order.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
};

export default WorkOrderMobileList;
