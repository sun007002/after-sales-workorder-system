/**
 * Mobile layout (width < 768px).
 * Top bar + content area + bottom tab bar.
 */
import React from 'react';
import { Box } from '@mui/material';
import TopBar from './TopBar';
import MobileTabBar from './MobileTabBar';

/**
 * Mobile layout component with top bar and bottom tab navigation.
 */
const MobileLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 2,
          pb: 8, // Space for bottom tab bar.
          maxWidth: '100%',
        }}
      >
        {children}
      </Box>
      <MobileTabBar />
    </Box>
  );
};

export default MobileLayout;
