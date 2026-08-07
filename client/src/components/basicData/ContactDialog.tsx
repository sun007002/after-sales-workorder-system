/**
 * ContactDialog component.
 * Dialog for creating and editing customer contacts.
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
import type { Contact } from '../../types';

/** Props for ContactDialog. */
export interface ContactDialogProps {
  open: boolean;
  contact?: Contact | null;
  onClose: () => void;
  onSubmit: (data: { name: string; phone: string | null }) => Promise<void>;
}

/**
 * Dialog for creating or editing a customer contact.
 */
const ContactDialog: React.FC<ContactDialogProps> = ({ open, contact, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  /** Resets form when dialog opens or contact changes. */
  useEffect(() => {
    if (open) {
      setName(contact?.name || '');
      setPhone(contact?.phone || '');
    }
  }, [open, contact]);

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
        {contact ? '编辑联系人' : '新增联系人'}
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="联系人姓名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
          required
          autoFocus
        />
        <TextField
          fullWidth
          label="联系电话"
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

export default ContactDialog;
