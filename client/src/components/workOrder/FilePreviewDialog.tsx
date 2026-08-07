/**
 * FilePreviewDialog component.
 * Displays a full-size image preview in a MUI Dialog.
 */
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { WorkOrderFile } from '../../types';

/** Props for FilePreviewDialog. */
export interface FilePreviewDialogProps {
  file: WorkOrderFile;
  onClose: () => void;
}

/**
 * Image preview dialog for viewing uploaded image files at full size.
 */
const FilePreviewDialog: React.FC<FilePreviewDialogProps> = ({ file, onClose }) => {
  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' },
      }}
    >
      <DialogTitle sx={{ pr: 6 }}>
        {file.originalName}
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: 2,
        }}
      >
        <img
          src={`/uploads/${file.filePath}`}
          alt={file.originalName}
          style={{
            maxWidth: '100%',
            maxHeight: '70vh',
            objectFit: 'contain',
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default FilePreviewDialog;
