/**
 * StaffPage - After-sales staff management page.
 * Displays staff list with create/edit/delete/toggle status actions.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Box,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import PageHeader from '../components/common/PageHeader';
import StaffDialog from '../components/basicData/StaffDialog';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import { getStaffList, createStaff, updateStaff, deleteStaff, toggleStaffStatus } from '../api/staff.api';
import { usePermission } from '../hooks/usePermission';
import { useSnackbar } from 'notistack';
import { formatDate } from '../utils/format';
import type { Staff } from '../types';

/**
 * Staff management page with table and CRUD dialogs.
 */
const StaffPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { hasPermission } = usePermission();
  const { enqueueSnackbar } = useSnackbar();

  const canManage = hasPermission('staff:manage');

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /** Loads all staff members. */
  const loadStaff = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getStaffList();
      setStaffList(data);
    } catch {
      // Error handled by interceptor.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  /** Opens create dialog. */
  const handleCreate = () => {
    setEditingStaff(null);
    setDialogOpen(true);
  };

  /** Opens edit dialog. */
  const handleEdit = (staff: Staff) => {
    setEditingStaff(staff);
    setDialogOpen(true);
  };

  /** Handles staff create/update submission. */
  const handleSubmit = async (data: { name: string; phone: string | null }) => {
    try {
      if (editingStaff) {
        await updateStaff(editingStaff.id, data);
        enqueueSnackbar('更新成功', { variant: 'success' });
      } else {
        await createStaff(data);
        enqueueSnackbar('创建成功', { variant: 'success' });
      }
      loadStaff();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : '操作失败', { variant: 'error' });
      throw err;
    }
  };

  /** Handles staff deletion. */
  const handleDelete = async () => {
    if (deleteId === null) return;
    setDeleteLoading(true);
    try {
      await deleteStaff(deleteId);
      enqueueSnackbar('删除成功', { variant: 'success' });
      setDeleteId(null);
      loadStaff();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : '删除失败', { variant: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  /** Toggles staff status. */
  const handleToggleStatus = async (staff: Staff) => {
    try {
      await toggleStaffStatus(staff.id);
      enqueueSnackbar('状态更新成功', { variant: 'success' });
      loadStaff();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : '操作失败', { variant: 'error' });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="售后人员管理"
        subtitle={`共 ${staffList.length} 人`}
        actions={
          canManage && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
              新增
            </Button>
          )
        }
      />

      {staffList.length === 0 ? (
        <EmptyState message="暂无售后人员" description="点击新增按钮添加售后人员" />
      ) : (
        <TableContainer component={Card} variant="outlined">
          <Table size={isMobile ? 'small' : 'medium'}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 120, minWidth: 100 }}>姓名</TableCell>
                <TableCell sx={{ width: 160, minWidth: 140 }}>手机号</TableCell>
                <TableCell align="center" sx={{ width: 100, minWidth: 80 }}>状态</TableCell>
                <TableCell sx={{ width: 170, minWidth: 150 }}>创建时间</TableCell>
                {canManage && <TableCell align="center" sx={{ width: 160, minWidth: 140 }}>操作</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {staffList.map((staff) => (
                <TableRow key={staff.id} hover>
                  <TableCell sx={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{staff.name}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{staff.phone || '-'}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={staff.status === 'active' ? '启用' : '禁用'}
                      size="small"
                      color={staff.status === 'active' ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{formatDate(staff.createdAt)}</TableCell>
                  {canManage && (
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleEdit(staff)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleToggleStatus(staff)}>
                        <PowerSettingsNewIcon fontSize="small" color={staff.status === 'active' ? 'error' : 'success'} />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => setDeleteId(staff.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <StaffDialog
        open={dialogOpen}
        staff={editingStaff}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={deleteId !== null}
        title="删除售后人员"
        message="确定要删除此售后人员吗？"
        confirmText="删除"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
};

export default StaffPage;
