/**
 * CustomerPage - Customer management page with contacts.
 * Displays customer list with expandable contact management.
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
  Collapse,
  Typography,
  Stack,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PageHeader from '../components/common/PageHeader';
import CustomerDialog from '../components/basicData/CustomerDialog';
import ContactDialog from '../components/basicData/ContactDialog';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import {
  getCustomerList,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getContacts,
  createContact,
  updateContact,
  deleteContact,
} from '../api/customer.api';
import { usePermission } from '../hooks/usePermission';
import { useSnackbar } from 'notistack';
import { formatDate } from '../utils/format';
import type { Customer, Contact } from '../types';

/**
 * Customer management page with nested contact management.
 */
const CustomerPage: React.FC = () => {
  const { hasPermission } = usePermission();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const canManage = hasPermission('customer:manage');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Expanded customer for contact management
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [contacts, setContacts] = useState<Record<number, Contact[]>>({});

  // Dialog state
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [contactCustomerId, setContactCustomerId] = useState<number | null>(null);

  // Delete state
  const [deleteCustomerId, setDeleteCustomerId] = useState<number | null>(null);
  const [deleteContactInfo, setDeleteContactInfo] = useState<{ customerId: number; contactId: number } | null>(null);

  /** Loads all customers. */
  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCustomerList();
      setCustomers(data);
    } catch {
      // Error handled by interceptor.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  /** Loads contacts for a specific customer. */
  const loadContacts = useCallback(async (customerId: number) => {
    try {
      const data = await getContacts(customerId);
      setContacts((prev) => ({ ...prev, [customerId]: data }));
    } catch {
      // Error handled by interceptor.
    }
  }, []);

  /** Toggles customer expansion to show/hide contacts. */
  const handleExpand = (customerId: number) => {
    if (expandedId === customerId) {
      setExpandedId(null);
    } else {
      setExpandedId(customerId);
      loadContacts(customerId);
    }
  };

  /** Opens create customer dialog. */
  const handleCreateCustomer = () => {
    setEditingCustomer(null);
    setCustomerDialogOpen(true);
  };

  /** Opens edit customer dialog. */
  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setCustomerDialogOpen(true);
  };

  /** Handles customer create/update. */
  const handleCustomerSubmit = async (data: { name: string }) => {
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, data);
        enqueueSnackbar('客户更新成功', { variant: 'success' });
      } else {
        await createCustomer(data);
        enqueueSnackbar('客户创建成功', { variant: 'success' });
      }
      loadCustomers();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : '操作失败', { variant: 'error' });
      throw err;
    }
  };

  /** Handles customer deletion. */
  const handleDeleteCustomer = async () => {
    if (deleteCustomerId === null) return;
    try {
      await deleteCustomer(deleteCustomerId);
      enqueueSnackbar('客户删除成功', { variant: 'success' });
      setDeleteCustomerId(null);
      loadCustomers();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : '删除失败', { variant: 'error' });
    }
  };

  /** Opens create contact dialog. */
  const handleCreateContact = (customerId: number) => {
    setContactCustomerId(customerId);
    setEditingContact(null);
    setContactDialogOpen(true);
  };

  /** Opens edit contact dialog. */
  const handleEditContact = (contact: Contact) => {
    setContactCustomerId(contact.customerId);
    setEditingContact(contact);
    setContactDialogOpen(true);
  };

  /** Handles contact create/update. */
  const handleContactSubmit = async (data: { name: string; phone: string | null }) => {
    if (contactCustomerId === null) return;
    try {
      if (editingContact) {
        await updateContact(contactCustomerId, editingContact.id, data);
        enqueueSnackbar('联系人更新成功', { variant: 'success' });
      } else {
        await createContact(contactCustomerId, data);
        enqueueSnackbar('联系人创建成功', { variant: 'success' });
      }
      loadContacts(contactCustomerId);
      loadCustomers();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : '操作失败', { variant: 'error' });
      throw err;
    }
  };

  /** Handles contact deletion. */
  const handleDeleteContact = async () => {
    if (!deleteContactInfo) return;
    try {
      await deleteContact(deleteContactInfo.customerId, deleteContactInfo.contactId);
      enqueueSnackbar('联系人删除成功', { variant: 'success' });
      setDeleteContactInfo(null);
      loadContacts(deleteContactInfo.customerId);
      loadCustomers();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : '删除失败', { variant: 'error' });
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
        title="客户管理"
        subtitle={`共 ${customers.length} 个客户`}
        actions={
          canManage && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateCustomer}>
              新增客户
            </Button>
          )
        }
      />

      {customers.length === 0 ? (
        <EmptyState message="暂无客户" description="点击新增按钮添加客户" />
      ) : (
        <TableContainer component={Card} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 40, minWidth: 40 }} />
                <TableCell sx={{ width: 200, minWidth: 160 }}>客户名称</TableCell>
                <TableCell align="center" sx={{ width: 110, minWidth: 90 }}>联系人数量</TableCell>
                <TableCell align="center" sx={{ width: 100, minWidth: 80 }}>状态</TableCell>
                <TableCell sx={{ width: 170, minWidth: 150 }}>创建时间</TableCell>
                {canManage && <TableCell align="center" sx={{ width: 140, minWidth: 120 }}>操作</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.map((customer) => (
                <React.Fragment key={customer.id}>
                  <TableRow hover>
                    <TableCell sx={{ width: 40 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleExpand(customer.id)}
                        sx={{
                          transform: expandedId === customer.id ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s',
                        }}
                      >
                        <ExpandMoreIcon />
                      </IconButton>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={customer.name}>{customer.name}</TableCell>
                    <TableCell align="center">{customer.contactCount}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={customer.status === 'active' ? '启用' : '禁用'}
                        size="small"
                        color={customer.status === 'active' ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{formatDate(customer.createdAt)}</TableCell>
                    {canManage && (
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => handleEditCustomer(customer)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => setDeleteCustomerId(customer.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 0, borderBottom: expandedId === customer.id ? '1px solid' : 'none', borderColor: 'divider' }}>
                      <Collapse in={expandedId === customer.id} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 2, px: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              联系人列表
                            </Typography>
                            {canManage && (
                              <Button
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={() => handleCreateContact(customer.id)}
                              >
                                新增联系人
                              </Button>
                            )}
                          </Box>
                          <Stack spacing={1}>
                            {(contacts[customer.id] || []).map((contact) => (
                              <Box
                                key={contact.id}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  p: 1,
                                  borderRadius: 1,
                                  bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
                                }}
                              >
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {contact.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {contact.phone || '无电话'}
                                  </Typography>
                                </Box>
                                {canManage && (
                                  <Box>
                                    <IconButton size="small" onClick={() => handleEditContact(contact)}>
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => setDeleteContactInfo({ customerId: customer.id, contactId: contact.id })}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                )}
                              </Box>
                            ))}
                            {(contacts[customer.id] || []).length === 0 && (
                              <Typography variant="body2" color="text.secondary" sx={{ py: 1, textAlign: 'center' }}>
                                暂无联系人
                              </Typography>
                            )}
                          </Stack>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <CustomerDialog
        open={customerDialogOpen}
        customer={editingCustomer}
        onClose={() => setCustomerDialogOpen(false)}
        onSubmit={handleCustomerSubmit}
      />

      <ContactDialog
        open={contactDialogOpen}
        contact={editingContact}
        onClose={() => setContactDialogOpen(false)}
        onSubmit={handleContactSubmit}
      />

      <ConfirmDialog
        open={deleteCustomerId !== null}
        title="删除客户"
        message="确定要删除此客户吗？已关联工单的客户无法删除。"
        confirmText="删除"
        confirmColor="error"
        onConfirm={handleDeleteCustomer}
        onCancel={() => setDeleteCustomerId(null)}
      />

      <ConfirmDialog
        open={deleteContactInfo !== null}
        title="删除联系人"
        message="确定要删除此联系人吗？"
        confirmText="删除"
        confirmColor="error"
        onConfirm={handleDeleteContact}
        onCancel={() => setDeleteContactInfo(null)}
      />
    </Box>
  );
};

export default CustomerPage;
