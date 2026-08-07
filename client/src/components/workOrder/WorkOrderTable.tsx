/**
 * WorkOrderTable component (PC).
 * Full table with all work order columns, unpaid row highlighting,
 * and action buttons (view/edit/delete/payment).
 *
 * Column widths are optimised for a 1600 px viewport (13 columns, ~1480 px
 * total) so that horizontal scrolling is unnecessary at that width.
 */
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Box,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { useUnpaidColors } from '../../utils/constants';
import type { WorkOrder } from '../../types';

/** Props for WorkOrderTable. */
export interface WorkOrderTableProps {
  workOrders: WorkOrder[];
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  canEdit: boolean;
  canDelete: boolean;
  canManagePayment?: boolean;
}

/** Ellipsis style for truncating long text in table cells. */
const ellipsisSx = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
} as const;

/**
 * PC table component for displaying work orders with full columns.
 */
const WorkOrderTable: React.FC<WorkOrderTableProps> = ({
  workOrders,
  onView,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}) => {
  const { bg: unpaidBg, text: unpaidText } = useUnpaidColors();

  if (workOrders.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
        暂无工单数据
      </Paper>
    );
  }

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <TableContainer component={Paper} elevation={0} variant="outlined">
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 100, minWidth: 90 }}>工单编号</TableCell>
              <TableCell sx={{ width: 160, minWidth: 140 }}>客户名称</TableCell>
              <TableCell sx={{ width: 90, minWidth: 80 }}>联系人</TableCell>
              <TableCell sx={{ width: 120, minWidth: 100 }}>联系电话</TableCell>
              <TableCell sx={{ width: 140, minWidth: 120 }}>售后人员</TableCell>
              <TableCell align="right" sx={{ width: 90, minWidth: 80 }}>人工费</TableCell>
              <TableCell align="right" sx={{ width: 90, minWidth: 80 }}>材料费</TableCell>
              <TableCell align="right" sx={{ width: 90, minWidth: 80 }}>交通差旅费</TableCell>
              <TableCell align="right" sx={{ width: 110, minWidth: 95 }}>合计金额</TableCell>
              <TableCell align="center" sx={{ width: 90, minWidth: 80 }}>结款状态</TableCell>
              <TableCell sx={{ width: 140, minWidth: 120 }}>开始时间</TableCell>
              <TableCell sx={{ width: 140, minWidth: 120 }}>结束时间</TableCell>
              <TableCell align="center" sx={{ width: 120, minWidth: 110 }}>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workOrders.map((order) => (
              <TableRow
                key={order.id}
                hover
                sx={{
                  cursor: 'pointer',
                  bgcolor: !order.isPaid ? unpaidBg : 'inherit',
                  '& td': {
                    color: !order.isPaid ? unpaidText : 'inherit',
                  },
                }}
                onClick={() => onView(order.id)}
              >
                <TableCell sx={{ width: 100, minWidth: 90, fontWeight: 600 }}>
                  {order.orderNo}
                </TableCell>
                <TableCell
                  sx={{ width: 160, minWidth: 140, ...ellipsisSx }}
                  title={order.customerName}
                >
                  {order.customerName}
                </TableCell>
                <TableCell sx={{ width: 90, minWidth: 80 }}>
                  {order.contactName}
                </TableCell>
                <TableCell sx={{ width: 120, minWidth: 100 }}>
                  {order.contactPhone || '-'}
                </TableCell>
                <TableCell
                  sx={{ width: 140, minWidth: 120, ...ellipsisSx }}
                  title={order.staffNames}
                >
                  {order.staffNames}
                </TableCell>
                <TableCell align="right" sx={{ width: 90, minWidth: 80 }}>
                  {formatCurrency(order.laborCost)}
                </TableCell>
                <TableCell align="right" sx={{ width: 90, minWidth: 80 }}>
                  {formatCurrency(order.materialCost)}
                </TableCell>
                <TableCell align="right" sx={{ width: 90, minWidth: 80 }}>
                  {formatCurrency(order.travelCost)}
                </TableCell>
                <TableCell align="right" sx={{ width: 110, minWidth: 95, fontWeight: 700 }}>
                  {formatCurrency(order.totalAmount)}
                </TableCell>
                <TableCell align="center" sx={{ width: 90, minWidth: 80 }}>
                  <Chip
                    label={order.isPaid ? '已结款' : '未结款'}
                    size="small"
                    color={order.isPaid ? 'success' : 'error'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell sx={{ width: 140, minWidth: 120, whiteSpace: 'nowrap' }}>
                  {formatDateTime(order.startTime)}
                </TableCell>
                <TableCell sx={{ width: 140, minWidth: 120, whiteSpace: 'nowrap' }}>
                  {formatDateTime(order.endTime)}
                </TableCell>
                <TableCell align="center" sx={{ width: 120, minWidth: 110 }} onClick={(e) => e.stopPropagation()}>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Tooltip title="查看详情">
                      <IconButton size="small" onClick={() => onView(order.id)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {canEdit && (
                      <Tooltip title="编辑">
                        <IconButton size="small" onClick={() => onEdit(order.id)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canDelete && (
                      <Tooltip title="删除">
                        <IconButton size="small" color="error" onClick={() => onDelete(order.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default WorkOrderTable;
