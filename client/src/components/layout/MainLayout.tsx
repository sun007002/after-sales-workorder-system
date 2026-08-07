/**
 * Main layout for PC/tablet (width >= 768px).
 * Fixed sidebar (240px, collapsible to 64px) + top bar + content area.
 */
import React from 'react';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useUIStore } from '../../store/uiStore';

/**
 * PC layout component with sidebar navigation and top bar.
 */
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          ml: { md: sidebarCollapsed ? '64px' : '240px' },
          transition: 'margin-left 0.2s ease',
        }}
      >
        <TopBar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            maxWidth: 1200,
            width: '100%',
            mx: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
