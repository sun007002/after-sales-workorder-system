/**
 * RolePage - Role management page.
 * Displays role list with create/edit/delete and permission assignment.
 */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  Box,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Typography,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PageHeader from '../components/common/PageHeader';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import {
  getRoleList,
  createRole,
  updateRole,
  deleteRole,
  type CreateRoleRequest,
  type UpdateRoleRequest,
} from '../api/role.api';
import { usePermission } from '../hooks/usePermission';
import { useSnackbar } from 'notistack';
import { PERMISSION_LIST } from '../utils/constants';
import type { Role } from '../types';

/** Role dialog form data. */
interface RoleFormData {
  name: string;
  description: string;
  permissions: string[];
}

/** Default empty form for creating a new role. */
const EMPTY_FORM: RoleFormData = {
  name: '',
  description: '',
  permissions: [],
};

/**
 * Groups permission list by module for display.
 * @returns Map of module name to permission items.
 */
function groupPermissionsByModule(): Record<string, typeof PERMISSION_LIST> {
  const groups: Record<string, typeof PERMISSION_LIST> = {};
  for (const perm of PERMISSION_LIST) {
    if (!groups[perm.module]) {
      groups[perm.module] = [];
    }
    groups[perm.module].push(perm);
  }
  return groups;
}

/**
 * Role management page with table, create/edit dialog, and permission selection.
 */
const RolePage: React.FC = () => {
  const { hasPermission } = usePermission();
  const { enqueueSnackbar } = useSnackbar();

  const canManage = hasPermission('role:manage');

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<RoleFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Delete state
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /** Memoized permission groups by module. */
  const permissionGroups = useMemo(() => groupPermissionsByModule(), []);

  /** Loads all roles. */
  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRoleList();
      setRoles(data);
    } catch {
      // Error handled by interceptor.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  /** Opens the create role dialog. */
  const handleCreate = () => {
    setEditingRole(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setDialogOpen(true);
  };

  /** Opens the edit role dialog. */
  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: [...role.permissions],
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  /** Validates the create/edit form. */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = '角色名称不能为空';
    }
    if (formData.permissions.length === 0) {
      errors.permissions = '请至少选择一个权限';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /** Handles create/edit form submission. */
  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      if (editingRole) {
        const updateData: UpdateRoleRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          permissions: formData.permissions,
        };
        await updateRole(editingRole.id, updateData);
        enqueueSnackbar('角色更新成功', { variant: 'success' });
      } else {
        const createData: CreateRoleRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          permissions: formData.permissions,
        };
        await createRole(createData);
        enqueueSnackbar('角色创建成功', { variant: 'success' });
      }
      setDialogOpen(false);
      loadRoles();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : '操作失败', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  /** Handles role deletion. */
  const handleDelete = async () => {
    if (deleteId === null) return;
    setDeleteLoading(true);
    try {
      await deleteRole(deleteId);
      enqueueSnackbar('角色删除成功', { variant: 'success' });
      setDeleteId(null);
      loadRoles();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : '删除失败', { variant: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  /** Toggles a single permission selection. */
  const handleTogglePermission = (code: string) => {
    setFormData((prev) => {
      if (prev.permissions.includes(code)) {
        return { ...prev, permissions: prev.permissions.filter((p) => p !== code) };
      }
      return { ...prev, permissions: [...prev.permissions, code] };
    });
  };

  /** Toggles all permissions in a module. */
  const handleToggleModule = (module: string, codes: string[]) => {
    const allSelected = codes.every((code) => formData.permissions.includes(code));
    if (allSelected) {
      // Remove all permissions in this module
      setFormData((prev) => ({
        ...prev,
        permissions: prev.permissions.filter((p) => !codes.includes(p)),
      }));
    } else {
      // Add all permissions in this module
      setFormData((prev) => {
        const newPerms = new Set(prev.permissions);
        codes.forEach((code) => newPerms.add(code));
        return { ...prev, permissions: Array.from(newPerms) };
      });
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
        title="角色管理"
        subtitle={`共 ${roles.length} 个角色`}
        actions={
          canManage && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
              新增角色
            </Button>
          )
        }
      />

      {roles.length === 0 ? (
        <EmptyState message="暂无角色" description="点击新增按钮添加角色" />
      ) : (
        <TableContainer component={Card} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 150, minWidth: 120 }}>角色名称</TableCell>
                <TableCell sx={{ width: 250, minWidth: 200 }}>描述</TableCell>
                <TableCell align="center" sx={{ width: 100, minWidth: 80 }}>用户数量</TableCell>
                <TableCell align="center" sx={{ width: 100, minWidth: 80 }}>权限数量</TableCell>
                {canManage && <TableCell align="center" sx={{ width: 140, minWidth: 120 }}>操作</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id} hover>
                  <TableCell sx={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{role.name}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={role.description || ''}>{role.description || '-'}</TableCell>
                  <TableCell align="center">{role.userCount}</TableCell>
                  <TableCell align="center">{role.permissions.length}</TableCell>
                  {canManage && (
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleEdit(role)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteId(role.id)}
                        disabled={role.userCount > 0}
                      >
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

      {/* Create/Edit Role Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          {editingRole ? '编辑角色' : '新增角色'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="角色名称"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={!!formErrors.name}
              helperText={formErrors.name}
            />
            <TextField
              label="描述"
              fullWidth
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <Divider />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                权限配置
              </Typography>
              {formErrors.permissions && (
                <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>
                  {formErrors.permissions}
                </Typography>
              )}
              {Object.entries(permissionGroups).map(([moduleName, perms]) => {
                const allSelected = perms.every((p) =>
                  formData.permissions.includes(p.code),
                );
                const someSelected = perms.some((p) =>
                  formData.permissions.includes(p.code),
                );
                return (
                  <Accordion key={moduleName} defaultExpanded elevation={0}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={allSelected}
                            indeterminate={!allSelected && someSelected}
                            onChange={() =>
                              handleToggleModule(
                                moduleName,
                                perms.map((p) => p.code),
                              )
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                        }
                        label={
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {moduleName}
                          </Typography>
                        }
                      />
                    </AccordionSummary>
                    <AccordionDetails>
                      <FormGroup>
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                              xs: '1fr',
                              sm: '1fr 1fr',
                              md: '1fr 1fr 1fr',
                            },
                            gap: 0.5,
                          }}
                        >
                          {perms.map((perm) => (
                            <FormControlLabel
                              key={perm.code}
                              control={
                                <Checkbox
                                  checked={formData.permissions.includes(perm.code)}
                                  onChange={() => handleTogglePermission(perm.code)}
                                  size="small"
                                />
                              }
                              label={perm.label}
                            />
                          ))}
                        </Box>
                      </FormGroup>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined">
            取消
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
            {submitting ? '提交中...' : '确认'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteId !== null}
        title="删除角色"
        message="确定要删除此角色吗？有关联用户的角色无法删除。"
        confirmText="删除"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
};

export default RolePage;
