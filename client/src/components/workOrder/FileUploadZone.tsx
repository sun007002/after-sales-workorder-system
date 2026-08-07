/**
 * FileUploadZone component.
 * Drag-and-drop or click-to-select file upload area.
 * Uploads files one by one via the work order file API.
 */
import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { uploadFile } from '../../api/workOrder.api';
import { useSnackbar } from 'notistack';

/** Props for FileUploadZone. */
export interface FileUploadZoneProps {
  workOrderId: number;
  onUploadSuccess: () => void;
}

/** Max file size in bytes (10MB). */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Allowed MIME types. */
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/pdf',
];

/**
 * Drag-and-drop file upload zone for work order attachments.
 */
const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  workOrderId,
  onUploadSuccess,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  /** Validates a single file before upload. */
  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `不支持的文件类型: ${file.type || file.name}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `文件 "${file.name}" 超过10MB限制`;
    }
    return null;
  };

  /** Uploads a single file with progress tracking. */
  const uploadSingleFile = useCallback(
    async (file: File): Promise<boolean> => {
      const error = validateFile(file);
      if (error) {
        enqueueSnackbar(error, { variant: 'warning' });
        return false;
      }

      try {
        await uploadFile(workOrderId, file);
        return true;
      } catch (err) {
        enqueueSnackbar(
          err instanceof Error ? err.message : `上传 "${file.name}" 失败`,
          { variant: 'error' },
        );
        return false;
      }
    },
    [workOrderId, enqueueSnackbar],
  );

  /** Handles file selection (from click or drop). */
  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;

      setUploading(true);
      setProgress(0);

      const filesArray = Array.from(fileList);
      const total = filesArray.length;
      let successCount = 0;

      for (let i = 0; i < filesArray.length; i++) {
        const ok = await uploadSingleFile(filesArray[i]);
        if (ok) successCount++;
        setProgress(((i + 1) / total) * 100);
      }

      setUploading(false);
      setProgress(0);

      if (successCount > 0) {
        enqueueSnackbar(
          `${successCount}/${total} 个文件上传成功`,
          { variant: 'success' },
        );
        onUploadSuccess();
      }
    },
    [uploadSingleFile, onUploadSuccess, enqueueSnackbar],
  );

  /** Handles drag over event. */
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  /** Handles drag leave event. */
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  /** Handles drop event. */
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  /** Handles click to open file selector. */
  const handleClick = () => {
    if (!uploading && inputRef.current) {
      inputRef.current.click();
    }
  };

  /** Handles file input change. */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input so the same file can be selected again.
    e.target.value = '';
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        sx={{
          border: '2px dashed',
          borderColor: isDragging ? 'primary.main' : 'grey.300',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          cursor: uploading ? 'wait' : 'pointer',
          transition: 'all 0.2s ease',
          bgcolor: isDragging ? 'primary.50' : 'grey.50',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'primary.50',
          },
          opacity: uploading ? 0.7 : 1,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={handleInputChange}
          accept=".jpg,.jpeg,.png,.gif,.webp,.xls,.xlsx,.doc,.docx,.pdf"
        />
        {uploading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary">
              上传中... {Math.round(progress)}%
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Typography variant="body2" color="text.secondary">
              拖拽文件到此处或点击上传
            </Typography>
            <Typography variant="caption" color="text.secondary">
              支持图片、Excel、Word、PDF，单文件最大10MB
            </Typography>
          </Box>
        )}
      </Box>
      {uploading && (
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ mt: 1, borderRadius: 1 }}
        />
      )}
    </Box>
  );
};

export default FileUploadZone;
