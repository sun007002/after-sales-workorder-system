/**
 * WorkOrderForm component.
 * Shared form for creating and editing work orders.
 * Features: customer→contact cascade, auto-fill phone, auto-calculate total,
 * multi-select staff.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  MenuItem,
  Autocomplete,
  Typography,
  InputAdornment,
  IconButton,
  Tooltip,
  CircularProgress,
  FormControlLabel,
  Switch,
  Alert,
  AlertTitle,
  Divider,
} from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import AddIcon from '@mui/icons-material/Add';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import CalculatorPopover from '../common/CalculatorPopover';
import CustomerDialog from '../basicData/CustomerDialog';
import ContactDialog from '../basicData/ContactDialog';
import StaffDialog from '../basicData/StaffDialog';
import { getCustomerList, getContacts, createCustomer, createContact } from '../../api/customer.api';
import { getStaffList, createStaff } from '../../api/staff.api';
import {
  createWorkOrder,
  updateWorkOrder,
  getWorkOrderById,
  getFiles,
  deleteFile,
  downloadFileBlob,
} from '../../api/workOrder.api';
import { formatCurrency, splitStaffNames } from '../../utils/format';
import { STAFF_NAMES_SEPARATOR, MAX_COST, MAX_DESCRIPTION_LENGTH } from '../../utils/constants';
import FileUploadZone from './FileUploadZone';
import FileList from './FileList';
import type { Customer, Contact, Staff, WorkOrderFile } from '../../types';

/** Props for the WorkOrderForm component. */
export interface WorkOrderFormProps {
  workOrderId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

/** Current local time formatted for a datetime-local input. */
const nowLocalDateTime = (): string => dayjs().format('YYYY-MM-DDTHH:mm');

/**
 * Work order form with customer→contact cascade, auto-fill phone,
 * auto-calculate total amount, and multi-select staff.
 */
const WorkOrderForm: React.FC<WorkOrderFormProps> = ({ workOrderId, onSuccess, onCancel }) => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const isEdit = !!workOrderId;

  // Form state
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [contactId, setContactId] = useState<number | null>(null);
  const [contactPhone, setContactPhone] = useState('');
  const [staffNames, setStaffNames] = useState<string[]>([]);
  // New work orders default the start time to now; edit mode loads the saved value.
  const [startTime, setStartTime] = useState(isEdit ? '' : nowLocalDateTime());
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [laborCost, setLaborCost] = useState('0');
  const [materialCost, setMaterialCost] = useState('0');
  const [travelCost, setTravelCost] = useState('0');
  const [isPaid, setIsPaid] = useState(false);
  const [orderNo, setOrderNo] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);

  // Calculator popover state: anchor element and which cost field it targets.
  const [calcAnchor, setCalcAnchor] = useState<HTMLElement | null>(null);
  const [calcTarget, setCalcTarget] = useState<'labor' | 'material' | 'travel' | null>(null);

  // Quick-create dialog state for customer / contact / staff.
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);

  // Post-create attachment state (Bug 2: upload files on the create page).
  const [createdId, setCreatedId] = useState<number | null>(null);
  const [createdOrderNo, setCreatedOrderNo] = useState('');
  const [files, setFiles] = useState<WorkOrderFile[]>([]);

  // Data state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);

  /** Calculates total amount from the three cost fields. */
  const totalAmount =
    (parseFloat(laborCost) || 0) +
    (parseFloat(materialCost) || 0) +
    (parseFloat(travelCost) || 0);

  /** Loads customers and staff list on mount. */
  useEffect(() => {
    const loadData = async () => {
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
    loadData();
  }, []);

  /** Loads contacts when customer changes. */
  const loadContacts = useCallback(async (cId: number) => {
    try {
      const contactData = await getContacts(cId, 'active');
      setContacts(contactData);
    } catch {
      setContacts([]);
    }
  }, []);

  /** Loads file list for the newly created work order (for inline upload). */
  const loadFiles = useCallback(async () => {
    if (!createdId) return;
    try {
      setFiles(await getFiles(createdId));
    } catch {
      // Error handled by interceptor.
    }
  }, [createdId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  /** Handles file download via authenticated blob request. */
  const handleDownload = useCallback(async (file: WorkOrderFile) => {
    if (!createdId) return;
    try {
      const blob = await downloadFileBlob(createdId, file.id);
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
  }, [createdId]);

  /** Handles file deletion. */
  const handleDeleteFile = useCallback(async (file: WorkOrderFile) => {
    if (!createdId) return;
    try {
      await deleteFile(createdId, file.id);
      loadFiles();
    } catch {
      // Error handled by interceptor.
    }
  }, [createdId, loadFiles]);

  /** Resets the form for creating another work order. */
  const handleCreateAnother = () => {
    setCreatedId(null);
    setCreatedOrderNo('');
    setFiles([]);
    setCustomerId(null);
    setContactId(null);
    setContactPhone('');
    setStaffNames([]);
    setStartTime(nowLocalDateTime());
    setEndTime('');
    setDescription('');
    setLaborCost('0');
    setMaterialCost('0');
    setTravelCost('0');
    setIsPaid(false);
    setContacts([]);
  };

  /** Loads existing work order data in edit mode. */
  useEffect(() => {
    if (!workOrderId) return;
    const loadWorkOrder = async () => {
      setInitialLoading(true);
      try {
        const wo = await getWorkOrderById(workOrderId);
        setOrderNo(wo.orderNo);
        setCreatedAt(wo.createdAt);
        setCustomerId(wo.customerId);
        setContactId(wo.contactId);
        setContactPhone(wo.contactPhone || '');
        setStaffNames(splitStaffNames(wo.staffNames));
        setDescription(wo.description);
        // Convert UTC ISO strings to local time for the datetime-local input.
        setStartTime(wo.startTime ? dayjs(wo.startTime).format('YYYY-MM-DDTHH:mm') : '');
        setEndTime(wo.endTime ? dayjs(wo.endTime).format('YYYY-MM-DDTHH:mm') : '');
        setLaborCost(String(wo.laborCost));
        setMaterialCost(String(wo.materialCost));
        setTravelCost(String(wo.travelCost));
        setIsPaid(wo.isPaid);
        await loadContacts(wo.customerId);
      } catch {
        enqueueSnackbar('加载工单数据失败', { variant: 'error' });
      } finally {
        setInitialLoading(false);
      }
    };
    loadWorkOrder();
  }, [workOrderId, loadContacts, enqueueSnackbar]);

  /** Handles customer selection - loads contacts for that customer. */
  const handleCustomerChange = (cId: number) => {
    setCustomerId(cId);
    setContactId(null);
    setContactPhone('');
    loadContacts(cId);
  };

  /** Handles contact selection - auto-fills phone number. */
  const handleContactChange = (cId: number) => {
    setContactId(cId);
    const contact = contacts.find((c) => c.id === cId);
    if (contact) {
      setContactPhone(contact.phone || '');
    }
  };

  /** Opens the calculator popover for a specific cost field. */
  const openCalculator = (
    event: React.MouseEvent<HTMLElement>,
    target: 'labor' | 'material' | 'travel',
  ) => {
    setCalcAnchor(event.currentTarget);
    setCalcTarget(target);
  };

  /** Renders the calculator icon adornment for a cost field. */
  const calcAdornment = (target: 'labor' | 'material' | 'travel') => (
    <InputAdornment position="end">
      <Tooltip title="计算器">
        <IconButton
          edge="end"
          size="small"
          aria-label="打开计算器"
          onClick={(e) => openCalculator(e, target)}
        >
          <CalculateIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </InputAdornment>
  );

  /** Applies the calculator result to the currently targeted cost field. */
  const applyCalcResult = (value: string) => {
    const num = String(Math.min(parseFloat(value) || 0, MAX_COST));
    if (calcTarget === 'labor') setLaborCost(num);
    else if (calcTarget === 'material') setMaterialCost(num);
    else if (calcTarget === 'travel') setTravelCost(num);
  };

  /** Quick-creates a customer, then selects it. */
  const handleCreateCustomer = async (data: { name: string }) => {
    const created = await createCustomer(data);
    setCustomers((prev) => [...prev, created]);
    handleCustomerChange(created.id);
    enqueueSnackbar('客户新增成功', { variant: 'success' });
  };

  /** Quick-creates a contact for the selected customer, then selects it. */
  const handleCreateContact = async (data: { name: string; phone: string | null }) => {
    if (!customerId) return;
    const created = await createContact(customerId, data);
    await loadContacts(customerId);
    setContactId(created.id);
    setContactPhone(created.phone || '');
    enqueueSnackbar('联系人新增成功', { variant: 'success' });
  };

  /** Quick-creates a staff member, then adds them to the selection. */
  const handleCreateStaff = async (data: { name: string; phone: string | null }) => {
    const created = await createStaff(data);
    setStaffList((prev) => [...prev, created]);
    setStaffNames((prev) => (prev.includes(created.name) ? prev : [...prev, created.name]));
    enqueueSnackbar('售后人员新增成功', { variant: 'success' });
  };

  /** Validates and submits the form. */
  const handleSubmit = async () => {
    // Validation
    if (!customerId) {
      enqueueSnackbar('请选择客户', { variant: 'warning' });
      return;
    }
    if (!contactId) {
      enqueueSnackbar('请选择联系人', { variant: 'warning' });
      return;
    }
    if (staffNames.length === 0) {
      enqueueSnackbar('请至少选择一名售后人员', { variant: 'warning' });
      return;
    }
    if (!description.trim()) {
      enqueueSnackbar('请填写售后描述', { variant: 'warning' });
      return;
    }
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      enqueueSnackbar(`售后描述不能超过${MAX_DESCRIPTION_LENGTH}字`, { variant: 'warning' });
      return;
    }

    const labor = parseFloat(laborCost) || 0;
    const material = parseFloat(materialCost) || 0;
    const travel = parseFloat(travelCost) || 0;
    if (labor > MAX_COST || material > MAX_COST || travel > MAX_COST) {
      enqueueSnackbar(`费用金额不能超过${MAX_COST}`, { variant: 'warning' });
      return;
    }

    // Validate start/end time: if both filled, start must be <= end.
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      if (start > end) {
        enqueueSnackbar('开始时间不能晚于结束时间', { variant: 'warning' });
        return;
      }
    }

    setLoading(true);
    try {
      const data = {
        customerId,
        contactId,
        contactPhone: contactPhone || null,
        staffNames,
        description: description.trim(),
        laborCost: labor,
        materialCost: material,
        travelCost: travel,
        isPaid,
        startTime: startTime ? new Date(startTime).toISOString() : null,
        endTime: endTime ? new Date(endTime).toISOString() : null,
      };

      if (isEdit && workOrderId) {
        await updateWorkOrder(workOrderId, data);
        enqueueSnackbar('工单更新成功', { variant: 'success' });
        onSuccess();
      } else {
        const created = await createWorkOrder(data);
        setCreatedId(created.id);
        setCreatedOrderNo(created.orderNo);
        enqueueSnackbar('工单创建成功', { variant: 'success' });
        // Stay on the page so the user can upload attachments inline.
      }
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : '操作失败', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {isEdit && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} md={3}>
            <TextField fullWidth size="small" label="工单编号" value={orderNo} disabled />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="录入时间"
              value={createdAt ? new Date(createdAt).toLocaleString('zh-CN') : ''}
              disabled
            />
          </Grid>
        </Grid>
      )}

      <Grid container spacing={2}>
        {/* Customer selection */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <TextField
              sx={{ flex: 1 }}
              select
              required
              label="客户名称"
              value={customerId ?? ''}
              onChange={(e) => handleCustomerChange(Number(e.target.value))}
            >
              {customers.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </TextField>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setCustomerDialogOpen(true)}
              sx={{ height: 40, flexShrink: 0, whiteSpace: 'nowrap' }}
            >
              新增
            </Button>
          </Box>
        </Grid>

        {/* Contact selection (cascaded from customer) */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <TextField
              sx={{ flex: 1 }}
              select
              required
              label="联系人"
              value={contactId ?? ''}
              onChange={(e) => handleContactChange(Number(e.target.value))}
              disabled={!customerId}
            >
              {contacts.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </TextField>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setContactDialogOpen(true)}
              disabled={!customerId}
              sx={{ height: 40, flexShrink: 0, whiteSpace: 'nowrap' }}
            >
              新增
            </Button>
          </Box>
        </Grid>

        {/* Contact phone (auto-filled) */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="联系电话"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="选择联系人后自动带出"
          />
        </Grid>

        {/* Staff multi-select */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <Autocomplete
              sx={{ flex: 1 }}
              multiple
              options={staffList}
              getOptionLabel={(option) => option.name}
              value={staffList.filter((s) => staffNames.includes(s.name))}
              onChange={(_e, newValue) => setStaffNames(newValue.map((s) => s.name))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  label="售后人员"
                  placeholder="选择售后人员"
                />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setStaffDialogOpen(true)}
              sx={{ height: 40, flexShrink: 0, whiteSpace: 'nowrap' }}
            >
              新增
            </Button>
          </Box>
        </Grid>

        {/* Start time */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="开始时间"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            InputProps={{ inputProps: { step: 3600 } }}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* End time */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="结束时间"
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            InputProps={{ inputProps: { step: 3600 } }}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Description */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            required
            label="售后描述"
            multiline
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            inputProps={{ maxLength: MAX_DESCRIPTION_LENGTH }}
            helperText={`${description.length}/${MAX_DESCRIPTION_LENGTH}`}
          />
        </Grid>

        {/* Cost fields */}
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="number"
            label="人工费"
            value={laborCost}
            onChange={(e) => setLaborCost(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">¥</InputAdornment>,
              endAdornment: calcAdornment('labor'),
              inputProps: { min: 0, max: MAX_COST, step: '0.01' },
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="number"
            label="材料费"
            value={materialCost}
            onChange={(e) => setMaterialCost(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">¥</InputAdornment>,
              endAdornment: calcAdornment('material'),
              inputProps: { min: 0, max: MAX_COST, step: '0.01' },
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="number"
            label="交通差旅费"
            value={travelCost}
            onChange={(e) => setTravelCost(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">¥</InputAdornment>,
              endAdornment: calcAdornment('travel'),
              inputProps: { min: 0, max: MAX_COST, step: '0.01' },
            }}
          />
        </Grid>

        {/* Total amount (read-only, auto-calculated) */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="合计金额"
            value={formatCurrency(totalAmount)}
            disabled
            sx={{
              '& .MuiInputBase-input.Mui-disabled': {
                fontWeight: 700,
                color: 'primary.main',
                WebkitTextFillColor: 'primary.main',
              },
            }}
          />
        </Grid>

        {/* Payment status */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', pt: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  color="success"
                />
              }
              label={isPaid ? '已结款' : '未结款'}
            />
          </Box>
        </Grid>
      </Grid>

      {/* Shared calculator popover for the cost fields (人工费/材料费/交通差旅费) */}
      <CalculatorPopover
        open={Boolean(calcAnchor)}
        anchorEl={calcAnchor}
        onClose={() => {
          setCalcAnchor(null);
          setCalcTarget(null);
        }}
        onConfirm={applyCalcResult}
      />

      {/* Quick-create dialogs */}
      <CustomerDialog
        open={customerDialogOpen}
        onClose={() => setCustomerDialogOpen(false)}
        onSubmit={handleCreateCustomer}
      />
      <ContactDialog
        open={contactDialogOpen}
        onClose={() => setContactDialogOpen(false)}
        onSubmit={handleCreateContact}
      />
      <StaffDialog
        open={staffDialogOpen}
        onClose={() => setStaffDialogOpen(false)}
        onSubmit={handleCreateStaff}
      />

      {/* Action buttons */}
      <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
        {!isEdit && createdId ? (
          <>
            <Button variant="outlined" onClick={handleCreateAnother}>
              再建一单
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate(`/work-orders/${createdId}`)}
            >
              完成
            </Button>
          </>
        ) : (
          <>
            <Button variant="outlined" onClick={onCancel}>
              取消
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : undefined}
            >
              {isEdit ? '保存修改' : '创建工单'}
            </Button>
          </>
        )}
      </Box>

      {/* Inline attachment area after creating a new work order (Bug 2). */}
      {!isEdit && createdId && (
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 2 }} />
          <Alert severity="success" sx={{ mb: 2 }}>
            <AlertTitle>工单 {createdOrderNo} 创建成功</AlertTitle>
            可在下方上传附件（支持图片、Excel、Word、PDF，单文件最大10MB）
          </Alert>
          <FileUploadZone
            workOrderId={createdId}
            onUploadSuccess={loadFiles}
          />
          <FileList
            files={files}
            loading={false}
            workOrderId={createdId}
            onDownload={handleDownload}
            onDelete={handleDeleteFile}
          />
        </Box>
      )}
    </Box>
  );
};

export default WorkOrderForm;
