/**
 * Top bar component.
 * Contains menu toggle (mobile), breadcrumb/title, user menu, and logout button.
 */
import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useAuth } from '../../hooks/useAuth';
import { useUIStore } from '../../store/uiStore';
import { ColorModeContext } from '../../theme';
import { MENU_ITEMS } from '../../utils/constants';

/** Maps path to page title. */
function getPageTitle(pathname: string): string {
  if (pathname === '/') return '仪表盘';
  if (pathname.startsWith('/work-orders/new')) return '新建工单';
  if (pathname.match(/\/work-orders\/\d+\/edit/)) return '编辑工单';
  if (pathname.match(/\/work-orders\/\d+/)) return '工单详情';
  const item = MENU_ITEMS.find(
    (m) => m.path !== '/' && pathname.startsWith(m.path),
  );
  if (item) return item.label;
  if (pathname.startsWith('/work-orders')) return '工单管理';
  return '售后工单系统';
}

/**
 * Top bar with page title, user info, and logout.
 */
const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const toggleMobileDrawer = useUIStore((state) => state.toggleMobileDrawer);
  const { mode, toggle } = useContext(ColorModeContext);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    await logout();
    navigate('/login');
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 56, md: 64 } }}>
        <IconButton
          edge="start"
          onClick={toggleMobileDrawer}
          sx={{ display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, fontWeight: 600, fontSize: { xs: 16, md: 18 } }}
        >
          {getPageTitle(location.pathname)}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            onClick={toggle}
            size="small"
            color="inherit"
            title={mode === 'dark' ? '切换到日间模式' : '切换到夜间模式'}
          >
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
          <IconButton onClick={handleMenu} size="small">
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
              {user?.displayName?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem disabled>
              <AccountCircleIcon sx={{ mr: 1 }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user?.displayName || '用户'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.roleName || ''}
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} />
              退出登录
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;
