/**
 * Mobile bottom tab bar component.
 * Fixed bottom navigation with 5 main entries.
 */
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';
import EngineeringIcon from '@mui/icons-material/Engineering';
import PersonIcon from '@mui/icons-material/Person';
import { usePermission } from '../../hooks/usePermission';
import { MOBILE_TABS } from '../../utils/constants';

/** Icon mapping for tab items. */
const ICON_MAP: Record<string, React.ReactElement> = {
  Dashboard: <DashboardIcon />,
  Assignment: <AssignmentIcon />,
  BarChart: <BarChartIcon />,
  Engineering: <EngineeringIcon />,
  Person: <PersonIcon />,
};

/**
 * Mobile bottom tab bar with permission-based tab rendering.
 */
const MobileTabBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = usePermission();

  /** Filters tabs based on user permissions. */
  const visibleTabs = MOBILE_TABS.filter(
    (tab) => !tab.permission || hasPermission(tab.permission),
  );

  /** Determines the active tab index based on current path. */
  const getActiveIndex = (): number => {
    const idx = visibleTabs.findIndex(
      (tab) =>
        location.pathname === tab.path ||
        (tab.path !== '/' && location.pathname.startsWith(tab.path)),
    );
    return idx >= 0 ? idx : 0;
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        elevation: 3,
      }}
    >
      <BottomNavigation
        showLabels
        value={getActiveIndex()}
        onChange={(_event, newValue: number) => {
          if (visibleTabs[newValue]) {
            navigate(visibleTabs[newValue].path);
          }
        }}
      >
        {visibleTabs.map((tab) => (
          <BottomNavigationAction
            key={tab.path}
            label={tab.label}
            icon={ICON_MAP[tab.icon] || <DashboardIcon />}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
};

export default MobileTabBar;
