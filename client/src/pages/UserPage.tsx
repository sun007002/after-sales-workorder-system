/**
 * UserPage - User management page.
 * Displays user list with create/edit/delete/toggle status/reset password actions.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import LockResetIcon from '@mui/icons-material/LockReset';
import PageHeader from '../components/common/PageHeader';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import {
  getUserList,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  resetPassword,
  type CreateUserRequest,
  type UpdateUserRequest,
} from '../api/user.api';
import { getRoleList } from '../api/role.api';
import { usePermission } from '../hooks/usePermission';
import { useSnackbar } from 'notistack';
import { formatDateTime } from '../utils/format';
import { MIN_PASSWORD_LENGTH } from '../utils/constants';
import type { User, Role } from '../types';

/** Create/edit user dialog form data. */
interface UserFormData {
  username: string;
  displayName: string;
  password: string;
  roleId: string;
  phone: string;
}

/** Default empty form for creating a new user. */
const EMPTY_FORM: UserFormData = {
  username: '',
  displayName: '',
  password: '',
  roleId: '',
  phone: '',
};

/**
 * User management page with table, create/edit dialogs, and delete confirmation.
 */
const UserPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { hasPermission } = usePermission();
  const { enqueueSnackbar } = useSnackbar();

  const canManage = hasPermission('user:manage');

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // Create/edit dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Delete state
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Reset password dialog state
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  /** Loads all users and roles. */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [userData, roleData] = await Promise.all([getUserList(), getRoleList()]);
      setUsers(userData);
      setRoles(roleData);
    } catch {
      // Error handled by interceptor.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /** Opens the create user dialog. */
  const handleCreate = () => {
    setEditingUser(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setDialogOpen(true);
  };

  /** Opens the edit user dialog. */
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      displayName: user.displayName,
      password: '',
      roleId: String(user.roleId),
      phone: user.phone || '',
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  /** Validates the create/edit form. */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.displayName.trim()) {
      errors.displayName = '显示名不能为空';
    }
    if (!formData.roleId) {
      errors.roleId = '请选择角色';
    }
    if (!editingUser) {
      if (!formData.username.trim()) {
        errors.username = '用户名不能为空';
      } else if (formData.username.length < 3) {
        errors.username = '用户名至少3个字符';
      }
      if (!formData.password) {
        errors.password = '密码不能为空';
      } else if (formData.password.length < MIN_PASSWORD_LENGTH) {
        errors.password = `密码至少${MIN_PASSWORD_LENGTH}个字符`;
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /** Handles create/edit form submission. */
  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      if (editingUser) {
        const updateData: UpdateUserRequest = {
          displayName: formData.displayName.trim(),
          roleId: parseInt(formData.roleId, 10),
          phone: formData.phone.trim() || null,
        };
        await updateUser(editingUser.id, updateData);
        enqueueSnackbar('用户更新成功', { variant: 'success' });
      } else {
        const createData: CreateUserRequest = {
          username: formData.username.trim(),
          displayName: formData.displayName.trim(),
          password: formData.password,
          roleId: parseInt(formData.roleId, 10),
          phone: formData.phone.trim() || null,
        };
        await createUser(createData);
        enqueueSnackbar('用户创建成功', { variant: 'success' });
      }
      setDialogOpen(false);
      loadData();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : '操作失败', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  /** Handles user deletion. */
  const handleDelete = async () => {
    if (deleteId === null) return;
    setDeleteLoading(true);
    try {
      await deleteUser(deleteId);
      enqueueSnackbar('用户删除成功', { variant: 'success' });
      setDeleteId(null);
      loadData();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : '删除失败', { variant: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  /** Toggles user active/disabled status. */
  const handleToggleStatus = async (user: User) => {
    try {
      await toggleUserStatus(user.id);
      enqueueSnackbar('状态更新成功', { variant: 'success' });
      loadData();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : '操作失败', { variant: 'error' });
    }
  };

  /** Opens the reset password dialog. */
  const handleOpenReset = (user: User) => {
    setResetUser(user);
    setNewPassword('');
  };

  /** Handles password reset submission. */
  const handleResetPassword = async () => {
    if (!resetUser) return;
    if (!newPassword) {
      enqueueSnackbar('请输入新密码', { variant: 'warning' });
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      enqueueSnackbar(`密码至少${MIN_PASSWORD_LENGTH}个字符`, { variant: 'warning' });
      return;
    }
    setResetLoading(true);
    try {
      await resetPassword(resetUser.id, newPassword);
      enqueueSnackbar('密码重置成功', { variant: 'success' });
      setResetUser(null);
      setNewPassword('');
      loadData();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : '密码重置失败', { variant: 'error' });
    } finally {
      setResetLoading(false);
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
        title="用户管理"
        subtitle={`共 ${users.length} 个用户`}
        actions={
          canManage && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
              新增用户
            </Button>
          )
        }
      />

      {users.length === 0 ? (
        <EmptyState message="暂无用户" description="点击新增按钮添加用户" />
      ) : (
        <TableContainer component={Card} variant="outlined">
          <Table size={isMobile ? 'small' : 'medium'}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 120, minWidth: 100 }}>用户名</TableCell>
                <TableCell sx={{ width: 120, minWidth: 100 }}>显示名</TableCell>
                <TableCell sx={{ width: 120, minWidth: 100 }}>角色</TableCell>
                <TableCell sx={{ width: 160, minWidth: 140 }}>手机号</TableCell>
                <TableCell align="center" sx={{ width: 140, minWidth: 120 }}>状态</TableCell>
                <TableCell sx={{ width: 170, minWidth: 150 }}>最后登录</TableCell>
                {canManage && <TableCell align="center" sx={{ width: 200, minWidth: 180 }}>操作</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell sx={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.username}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.displayName}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{user.roleName}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{user.phone || '-'}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                      <Chip
                        label={user.status === 'active' ? '启用' : '禁用'}
                        size="small"
                        color={user.status === 'active' ? 'success' : 'default'}
                        variant="outlined"
                      />
                      {user.mustChangePassword && (
                        <Chip label="需改密" size="small" color="warning" variant="outlined" />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>{formatDateTime(user.lastLoginAt)}</TableCell>
                  {canManage && (
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleEdit(user)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenReset(user)} title="重置密码">
                        <LockResetIcon fontSize="small" color="info" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleStatus(user)}
                        title={user.status === 'active' ? '禁用' : '启用'}
                      >
                        <PowerSettingsNewIcon
                          fontSize="small"
                          color={user.status === 'active' ? 'error' : 'success'}
                        />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => setDeleteId(user.id)}>
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

      {/* Create/Edit User Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          {editingUser ? '编辑用户' : '新增用户'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="用户名"
              fullWidth
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              error={!!formErrors.username}
              helperText={formErrors.username}
              disabled={!!editingUser}
            />
            <TextField
              label="显示名"
              fullWidth
              required
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              error={!!formErrors.displayName}
              helperText={formErrors.displayName}
            />
            {!editingUser && (
              <TextField
                label="密码"
                fullWidth
                required
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={!!formErrors.password}
                helperText={formErrors.password || `至少${MIN_PASSWORD_LENGTH}个字符`}
              />
            )}
            <TextField
              select
              label="角色"
              fullWidth
              required
              value={formData.roleId}
              onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
              error={!!formErrors.roleId}
              helperText={formErrors.roleId}
            >
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="手机号"
              fullWidth
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined">
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? '提交中...' : '确认'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={resetUser !== null}
        onClose={() => {
          setResetUser(null);
          setNewPassword('');
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>重置密码</DialogTitle>
        <DialogContent>
          <TextField
            label="新密码"
            fullWidth
            required
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            helperText={`至少${MIN_PASSWORD_LENGTH}个字符`}
            sx={{ mt: 1 }}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setResetUser(null);
              setNewPassword('');
            }}
            variant="outlined"
          >
            取消
          </Button>
          <Button
            onClick={handleResetPassword}
            variant="contained"
            disabled={resetLoading}
          >
            {resetLoading ? '重置中...' : '确认重置'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteId !== null}
        title="删除用户"
        message="确定要删除此用户吗？删除后不可恢复。"
        confirmText="删除"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
};

export default UserPage;
