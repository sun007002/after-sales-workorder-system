/**
 * Sidebar navigation component.
 * Fixed left sidebar with menu items filtered by user permissions.
 * Collapsible between 240px (expanded) and 64px (collapsed).
 */
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Divider,
  Box,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';
import EngineeringIcon from '@mui/icons-material/Engineering';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useUIStore } from '../../store/uiStore';
import { usePermission } from '../../hooks/usePermission';
import { MENU_ITEMS } from '../../utils/constants';

/** Icon mapping for menu items. */
const ICON_MAP: Record<string, React.ReactElement> = {
  Dashboard: <DashboardIcon />,
  Assignment: <AssignmentIcon />,
  BarChart: <BarChartIcon />,
  Engineering: <EngineeringIcon />,
  Business: <BusinessIcon />,
  People: <PeopleIcon />,
  AdminPanelSettings: <AdminPanelSettingsIcon />,
  Person: <PersonIcon />,
};

/**
 * Sidebar navigation with permission-based menu rendering.
 */
const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const { hasPermission } = usePermission();

  /** Filters menu items based on user permissions. */
  const visibleMenus = MENU_ITEMS.filter(
    (item) => !item.permission || hasPermission(item.permission),
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: sidebarCollapsed ? 64 : 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: sidebarCollapsed ? 64 : 240,
          boxSizing: 'border-box',
          transition: 'width 0.2s ease',
          overflowX: 'hidden',
        },
      }}
      open
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          px: 2,
          py: 2,
          minHeight: 64,
        }}
      >
        {!sidebarCollapsed && (
          <Typography variant="h6" color="primary" sx={{ fontWeight: 700, fontSize: 16 }}>
            售后工单系统
          </Typography>
        )}
        <IconButton onClick={toggleSidebar} size="small">
          {sidebarCollapsed ? <MenuIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>
      <Divider />
      <List>
        {visibleMenus.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  minHeight: 48,
                  justifyContent: sidebarCollapsed ? 'center' : 'initial',
                  px: 2.5,
                  bgcolor: isActive ? 'primary.light' : 'transparent',
                  '&:hover': { bgcolor: isActive ? 'primary.light' : 'action.hover' },
                  borderRight: isActive ? '3px solid' : 'none',
                  borderColor: 'primary.main',
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: sidebarCollapsed ? 0 : 2,
                    justifyContent: 'center',
                    color: isActive ? 'primary.main' : 'inherit',
                  }}
                >
                  {ICON_MAP[item.icon] || <DashboardIcon />}
                </ListItemIcon>
                {!sidebarCollapsed && (
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      sx: { color: isActive ? 'primary.main' : 'inherit', fontWeight: isActive ? 600 : 400 },
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
};

export default Sidebar;
