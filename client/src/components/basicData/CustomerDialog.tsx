/**
 * CustomerDialog component.
 * Dialog for creating and editing customers.
 */
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
} from '@mui/material';
import type { Customer } from '../../types';

/** Props for CustomerDialog. */
export interface CustomerDialogProps {
  open: boolean;
  customer?: Customer | null;
  onClose: () => void;
  onSubmit: (data: { name: string }) => Promise<void>;
}

/**
 * Dialog for creating or editing a customer.
 */
const CustomerDialog: React.FC<CustomerDialogProps> = ({ open, customer, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  /** Resets form when dialog opens or customer changes. */
  useEffect(() => {
    if (open) {
      setName(customer?.name || '');
    }
  }, [open, customer]);

  /** Handles form submission. */
  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSubmit({ name: name.trim() });
      onClose();
    } catch {
      // Error handled by caller.
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>
        {customer ? '编辑客户' : '新增客户'}
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="客户名称"
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
          required
          autoFocus
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">
          取消
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !name.trim()}
          startIcon={loading ? <CircularProgress size={16} /> : undefined}
        >
          确认
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerDialog;
