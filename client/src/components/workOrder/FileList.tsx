/**
 * FileList component.
 * Displays a list of uploaded files with type icons, size, uploader info,
 * download and delete actions. Supports image thumbnail preview.
 */
import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Typography,
  CircularProgress,
  Avatar,
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import TableChartIcon from '@mui/icons-material/TableChart';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import { formatDateTime } from '../../utils/format';
import FilePreviewDialog from './FilePreviewDialog';
import type { WorkOrderFile } from '../../types';

/** Props for FileList. */
export interface FileListProps {
  files: WorkOrderFile[];
  loading: boolean;
  workOrderId: number;
  onDownload: (file: WorkOrderFile) => void;
  onDelete?: (file: WorkOrderFile) => void;
}

/** Formats file size in human-readable form. */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/** Gets the appropriate icon for a file type. */
function getFileIcon(fileType: string): React.ReactElement {
  if (fileType.startsWith('image/')) return <ImageIcon />;
  if (
    fileType === 'application/vnd.ms-excel' ||
    fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    return <TableChartIcon />;
  }
  if (
    fileType === 'application/msword' ||
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return <DescriptionIcon />;
  }
  if (fileType === 'application/pdf') return <PictureAsPdfIcon />;
  return <AttachFileIcon />;
}

/** Checks if a file type is an image. */
function isImage(fileType: string): boolean {
  return fileType.startsWith('image/');
}

/**
 * File list with download/delete actions and image thumbnail preview.
 */
const FileList: React.FC<FileListProps> = ({
  files,
  loading,
  workOrderId,
  onDownload,
  onDelete,
}) => {
  const [previewFile, setPreviewFile] = useState<WorkOrderFile | null>(null);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (files.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
        暂无附件
      </Typography>
    );
  }

  return (
    <>
      <List dense>
        {files.map((file) => (
          <ListItem
            key={file.id}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              mb: 1,
              '&:hover': { bgcolor: 'grey.50' },
            }}
            secondaryAction={
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="下载">
                  <IconButton
                    size="small"
                    edge="end"
                    onClick={() => onDownload(file)}
                  >
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {onDelete && (
                  <Tooltip title="删除">
                    <IconButton
                      size="small"
                      edge="end"
                      color="error"
                      onClick={() => onDelete(file)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            }
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              {isImage(file.fileType) ? (
                <Avatar
                  variant="rounded"
                  sx={{ width: 36, height: 36, cursor: 'pointer' }}
                  src={`/uploads/${file.filePath}`}
                  onClick={() => setPreviewFile(file)}
                >
                  {getFileIcon(file.fileType)}
                </Avatar>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', width: 36, height: 36 }}>
                  {getFileIcon(file.fileType)}
                </Box>
              )}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    variant="body2"
                    component="span"
                    sx={{
                      fontWeight: 500,
                      cursor: isImage(file.fileType) ? 'pointer' : 'default',
                      '&:hover': isImage(file.fileType)
                        ? { color: 'primary.main' }
                        : {},
                    }}
                    onClick={() => {
                      if (isImage(file.fileType)) setPreviewFile(file);
                    }}
                  >
                    {file.originalName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(file.fileSize)}
                  </Typography>
                </Box>
              }
              secondary={
                <Typography variant="caption" color="text.secondary">
                  {file.uploadedByName} · {formatDateTime(file.createdAt)}
                </Typography>
              }
            />
          </ListItem>
        ))}
      </List>

      {previewFile && (
        <FilePreviewDialog
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </>
  );
};

export default FileList;
