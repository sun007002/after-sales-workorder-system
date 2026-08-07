/**
 * ConfirmDialog component.
 * Reusable confirmation dialog for delete and other destructive actions.
 */
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

/** ConfirmDialog props. */
export interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'error' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Reusable confirmation dialog.
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title = '确认操作',
  message,
  confirmText = '确认',
  cancelText = '取消',
  confirmColor = 'primary',
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText color="text.primary">{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} variant="outlined">
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={confirmColor}
          autoFocus
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
