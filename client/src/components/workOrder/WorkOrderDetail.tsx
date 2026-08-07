/**
 * WorkOrderDetail component.
 * Displays all work order fields including audit info.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Typography,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Paper,
  useTheme,
} from '@mui/material';
import { formatCurrency, formatDateTime, formatDuration } from '../../utils/format';
import { getFiles, deleteFile, downloadFileBlob } from '../../api/workOrder.api';
import { usePermission } from '../../hooks/usePermission';
import FileUploadZone from './FileUploadZone';
import FileList from './FileList';
import type { WorkOrder, WorkOrderFile } from '../../types';

/** Props for WorkOrderDetail. */
export interface WorkOrderDetailProps {
  workOrder: WorkOrder;
  onFileUploaded?: () => void;
}

/** Info row component for label-value pairs. */
const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => {
  const theme = useTheme();
  const labelBg = theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50';
  return (
    <TableRow>
      <TableCell sx={{ width: 140, fontWeight: 600, bgcolor: labelBg }}>{label}</TableCell>
      <TableCell>{value || '-'}</TableCell>
    </TableRow>
  );
};

/**
 * Work order detail view showing all fields, audit information, and file attachments.
 */
const WorkOrderDetail: React.FC<WorkOrderDetailProps> = ({ workOrder, onFileUploaded }) => {
  const { hasPermission } = usePermission();
  const theme = useTheme();
  const canUpdate = hasPermission('workorder:update');
  const [files, setFiles] = useState<WorkOrderFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);

  /** Loads file list for the work order. */
  const loadFiles = useCallback(async () => {
    if (!workOrder.id) return;
    setFilesLoading(true);
    try {
      const data = await getFiles(workOrder.id);
      setFiles(data);
    } catch {
      // Error handled by interceptor.
    } finally {
      setFilesLoading(false);
    }
  }, [workOrder.id]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  /** Handles file upload success - refreshes file list. */
  const handleUploadSuccess = useCallback(() => {
    loadFiles();
    onFileUploaded?.();
  }, [loadFiles, onFileUploaded]);

  /** Handles file download via an authenticated blob request. */
  const handleDownload = useCallback(async (file: WorkOrderFile) => {
    try {
      const blob = await downloadFileBlob(workOrder.id, file.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      // Error handled by interceptor.
    }
  }, [workOrder.id]);

  /** Handles file deletion. */
  const handleDeleteFile = useCallback(async (file: WorkOrderFile) => {
    try {
      await deleteFile(workOrder.id, file.id);
      loadFiles();
    } catch {
      // Error handled by interceptor.
    }
  }, [workOrder.id, loadFiles]);

  return (
    <Box>
      {/* Header with order number and payment status */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          工单 {workOrder.orderNo}
        </Typography>
        <Chip
          label={workOrder.isPaid ? '已结款' : '未结款'}
          color={workOrder.isPaid ? 'success' : 'error'}
          variant="outlined"
        />
      </Box>

      <Grid container spacing={3}>
        {/* Basic info */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            基本信息
          </Typography>
          <Table size="small">
            <TableBody>
              <InfoRow label="工单编号" value={workOrder.orderNo} />
              <InfoRow label="客户名称" value={workOrder.customerName} />
              <InfoRow label="联系人" value={workOrder.contactName} />
              <InfoRow label="联系电话" value={workOrder.contactPhone} />
              <InfoRow label="售后人员" value={workOrder.staffNames} />
              <InfoRow label="录入时间" value={formatDateTime(workOrder.createdAt)} />
              <InfoRow label="开始时间" value={formatDateTime(workOrder.startTime)} />
              <InfoRow label="结束时间" value={formatDateTime(workOrder.endTime)} />
              <InfoRow
                label="服务时长"
                value={
                  workOrder.startTime && workOrder.endTime
                    ? formatDuration(workOrder.startTime, workOrder.endTime)
                    : '-'
                }
              />
            </TableBody>
          </Table>
        </Grid>

        {/* Cost info */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            费用信息
          </Typography>
          <Table size="small">
            <TableBody>
              <InfoRow label="人工费" value={formatCurrency(workOrder.laborCost)} />
              <InfoRow label="材料费" value={formatCurrency(workOrder.materialCost)} />
              <InfoRow label="交通差旅费" value={formatCurrency(workOrder.travelCost)} />
              <InfoRow
                label="合计金额"
                value={
                  <Typography component="span" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {formatCurrency(workOrder.totalAmount)}
                  </Typography>
                }
              />
              <InfoRow
                label="结款状态"
                value={
                  <Chip
                    label={workOrder.isPaid ? '已结款' : '未结款'}
                    size="small"
                    color={workOrder.isPaid ? 'success' : 'error'}
                  />
                }
              />
            </TableBody>
          </Table>
        </Grid>

        {/* Description */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            售后描述
          </Typography>
          <Box
            sx={{
              p: 2,
              bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
              borderRadius: 1,
              minHeight: 60,
              whiteSpace: 'pre-wrap',
            }}
          >
            {workOrder.description}
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Divider />
        </Grid>

        {/* Audit info */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            审计信息
          </Typography>
          <Table size="small">
            <TableBody>
              <InfoRow label="创建人" value={workOrder.createdByName} />
              <InfoRow label="创建时间" value={formatDateTime(workOrder.createdAt)} />
              <InfoRow label="最后修改人" value={workOrder.updatedByName || '-'} />
              <InfoRow label="最后修改时间" value={formatDateTime(workOrder.updatedAt)} />
            </TableBody>
          </Table>
        </Grid>

        {/* File attachments (FEAT-3) */}
        <Grid item xs={12}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            附件
          </Typography>
          {canUpdate && (
            <FileUploadZone
              workOrderId={workOrder.id}
              onUploadSuccess={handleUploadSuccess}
            />
          )}
          <FileList
            files={files}
            loading={filesLoading}
            workOrderId={workOrder.id}
            onDownload={handleDownload}
            onDelete={canUpdate ? handleDeleteFile : undefined}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default WorkOrderDetail;
