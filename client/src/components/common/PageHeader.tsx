/**
 * PageHeader component.
 * Displays a page title with optional action buttons.
 */
import React from 'react';
import { Box, Typography } from '@mui/material';

/** PageHeader props. */
export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

/**
 * Page header with title and action area.
 */
const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2,
        mb: 3,
      }}
    >
      <Box>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>{actions}</Box>
      )}
    </Box>
  );
};

export default PageHeader;
