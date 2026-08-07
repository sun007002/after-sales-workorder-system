/**
 * StatCard component.
 * Displays a metric with title, value, icon, and optional color.
 */
import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

/** StatCard props. */
export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'error' | 'default';
  subtitle?: string;
  subValue?: string;
}

/** Color mapping for stat cards. */
const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  primary: { bg: '#E3F2FD', text: '#1976D2' },
  success: { bg: '#E8F5E9', text: '#4CAF50' },
  error: { bg: '#FFEBEE', text: '#F44336' },
  default: { bg: '#F5F5F5', text: '#616161' },
};

/**
 * StatCard displays a key metric in a card layout.
 */
const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = 'default',
  subtitle,
  subValue,
}) => {
  const colors = COLOR_MAP[color] || COLOR_MAP.default;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {title}
            </Typography>
            <Typography variant="h5" component="div" sx={{ fontWeight: 700, fontSize: { xs: 18, md: 22 } }}>
              {value}
            </Typography>
            {subValue && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                {subValue}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: colors.bg,
                color: colors.text,
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;
