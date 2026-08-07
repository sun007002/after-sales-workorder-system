/**
 * EmptyState component.
 * Displays a friendly empty state with icon and message.
 */
import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

/** EmptyState props. */
export interface EmptyStateProps {
  message?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

/**
 * Empty state component for lists with no data.
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  message = '暂无数据',
  description,
  actionText,
  onAction,
  icon,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 6,
        px: 3,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: 'grey.100',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
          color: 'text.secondary',
        }}
      >
        {icon || <InboxIcon sx={{ fontSize: 40 }} />}
      </Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
        {message}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
      )}
      {actionText && onAction && (
        <Button variant="contained" onClick={onAction} size="small">
          {actionText}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;
