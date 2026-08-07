import { useTheme } from '@mui/material/styles';

/**
 * Application constants.
 */

/** Staff names separator (Chinese enumeration comma). */
export const STAFF_NAMES_SEPARATOR = '、';

/** Default page size for paginated lists. */
export const DEFAULT_PAGE_SIZE = 20;

/** Maximum cost value. */
export const MAX_COST = 999999.99;

/** Maximum description length. */
export const MAX_DESCRIPTION_LENGTH = 1000;

/** Minimum password length. */
export const MIN_PASSWORD_LENGTH = 8;

/** Maximum login attempts before lockout. */
export const MAX_LOGIN_ATTEMPTS = 5;

/** Lock duration in minutes. */
export const LOCK_DURATION_MINUTES = 30;

/** Unpaid row background color (light mode). */
export const UNPAID_BG_COLOR = '#FFF0F0';

/** Unpaid row text color (light mode). */
export const UNPAID_TEXT_COLOR = '#D32F2F';

/** Unpaid row background color (dark mode). */
export const UNPAID_BG_COLOR_DARK = 'rgba(239, 68, 68, 0.18)';

/** Unpaid row text color (dark mode). */
export const UNPAID_TEXT_COLOR_DARK = '#FCA5A5';

/** All available permission codes with labels for UI. */
export const PERMISSION_LIST: { code: string; label: string; module: string }[] = [
  { code: 'workorder:create', label: '工单录入', module: '工单管理' },
  { code: 'workorder:read', label: '工单查看', module: '工单管理' },
  { code: 'workorder:update', label: '工单编辑', module: '工单管理' },
  { code: 'workorder:delete', label: '工单删除', module: '工单管理' },
  { code: 'staff:read', label: '人员查看', module: '基础数据' },
  { code: 'staff:manage', label: '人员管理', module: '基础数据' },
  { code: 'customer:read', label: '客户查看', module: '基础数据' },
  { code: 'customer:manage', label: '客户管理', module: '基础数据' },
  { code: 'summary:view', label: '汇总查询', module: '汇总查询' },
  { code: 'payment:manage', label: '结款管理', module: '工单管理' },
  { code: 'user:manage', label: '用户管理', module: '权限管理' },
  { code: 'role:manage', label: '角色管理', module: '权限管理' },
];

/** Navigation menu items with permission requirements. */
export const MENU_ITEMS: {
  path: string;
  label: string;
  icon: string;
  permission?: string;
}[] = [
  { path: '/', label: '仪表盘', icon: 'Dashboard' },
  { path: '/work-orders', label: '工单管理', icon: 'Assignment', permission: 'workorder:read' },
  { path: '/summary', label: '汇总查询', icon: 'BarChart', permission: 'summary:view' },
  { path: '/staff', label: '售后人员', icon: 'Engineering', permission: 'staff:read' },
  { path: '/customers', label: '客户管理', icon: 'Business', permission: 'customer:read' },
  { path: '/users', label: '用户管理', icon: 'People', permission: 'user:manage' },
  { path: '/roles', label: '角色管理', icon: 'AdminPanelSettings', permission: 'role:manage' },
];

/** Mobile tab bar items (max 5). */
export const MOBILE_TABS: {
  path: string;
  label: string;
  icon: string;
  permission?: string;
}[] = [
  { path: '/', label: '首页', icon: 'Dashboard' },
  { path: '/work-orders', label: '工单', icon: 'Assignment', permission: 'workorder:read' },
  { path: '/summary', label: '查询', icon: 'BarChart', permission: 'summary:view' },
  { path: '/staff', label: '数据', icon: 'Engineering', permission: 'staff:read' },
  { path: '/users', label: '我的', icon: 'Person' },
];

/**
 * React hook that returns the appropriate unpaid-row colors based on the
 * current MUI theme mode (light vs dark).
 *
 * Usage:
 *   const { bg, text } = useUnpaidColors();
 *   sx={{ bgcolor: bg, color: text }}
 */
export function useUnpaidColors(): { bg: string; text: string } {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return {
    bg: isDark ? UNPAID_BG_COLOR_DARK : UNPAID_BG_COLOR,
    text: isDark ? UNPAID_TEXT_COLOR_DARK : UNPAID_TEXT_COLOR,
  };
}
