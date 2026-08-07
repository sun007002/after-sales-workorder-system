/**
 * StaffDialog component.
 * Dialog for creating and editing after-sales staff members.
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
import type { Staff } from '../../types';

/** Props for StaffDialog. */
export interface StaffDialogProps {
  open: boolean;
  staff?: Staff | null;
  onClose: () => void;
  onSubmit: (data: { name: string; phone: string | null }) => Promise<void>;
}

/**
 * Dialog for creating or editing an after-sales staff member.
 */
const StaffDialog: React.FC<StaffDialogProps> = ({ open, staff, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  /** Resets form when dialog opens or staff changes. */
  useEffect(() => {
    if (open) {
      setName(staff?.name || '');
      setPhone(staff?.phone || '');
    }
  }, [open, staff]);

  /** Handles form submission. */
  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSubmit({ name: name.trim(), phone: phone.trim() || null });
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
        {staff ? '编辑售后人员' : '新增售后人员'}
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="姓名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
          required
          autoFocus
        />
        <TextField
          fullWidth
          label="手机号"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          margin="normal"
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

export default StaffDialog;
