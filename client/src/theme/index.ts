import { createTheme } from '@mui/material/styles';
import { createContext } from 'react';
import type { Theme } from '@mui/material/styles';

/** Color mode type. */
export type ColorMode = 'light' | 'dark';

/** Context value for color mode toggle. */
export interface ColorModeContextValue {
  mode: ColorMode;
  toggle: () => void;
}

/** Context providing the current color mode and a toggle function. */
export const ColorModeContext = createContext<ColorModeContextValue>({
  mode: 'light',
  toggle: () => {},
});

/** Common typography shared by both themes. */
const commonTypography = {
  fontFamily: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
  ].join(','),
  fontSize: 14,
  h5: { fontWeight: 600 },
  h6: { fontWeight: 600 },
  subtitle1: { fontWeight: 500 },
};

/**
 * Shared component overrides. Callbacks receive the active theme so
 * palette values (including mode-aware colors) resolve correctly at
 * render time for both light and dark themes.
 */
function sharedComponents() {
  return {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 4,
          minWidth: 44,
          minHeight: 36,
        },
        contained: ({ theme }: { theme: Theme }) => ({
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          color: '#FFFFFF',
          '&:hover': {
            filter: 'brightness(1.1)',
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          },
          '&:focus-visible': {
            boxShadow: `0 0 0 3px ${theme.palette.primary.main}40`,
          },
        }),
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small' as const,
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '8px 16px',
        },
        head: ({ theme }: { theme: Theme }) => ({
          fontWeight: 600,
          backgroundColor:
            theme.palette.mode === 'dark'
              ? theme.palette.background.paper
              : theme.palette.grey[100],
        }),
      },
    },
  };
}

/** Light theme — modern, clean aesthetic. */
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563EB',
      light: '#60A5FA',
      dark: '#1D4ED8',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#7C3AED',
      light: '#A78BFA',
      dark: '#6D28D9',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#10B981',
      light: '#34D399',
      dark: '#059669',
    },
    error: {
      main: '#EF4444',
      light: '#F87171',
      dark: '#DC2626',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
  },
  typography: commonTypography,
  shape: { borderRadius: 8 },
  components: sharedComponents(),
});

/** Dark theme — tech / cyber aesthetic. */
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#06B6D4',
      light: '#22D3EE',
      dark: '#0891B2',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#8B5CF6',
      light: '#A78BFA',
      dark: '#7C3AED',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#10B981',
      light: '#34D399',
      dark: '#059669',
    },
    error: {
      main: '#EF4444',
      light: '#F87171',
      dark: '#DC2626',
    },
    background: {
      default: '#0F172A',
      paper: '#1E293B',
    },
    text: {
      primary: '#F1F5F9',
      secondary: '#94A3B8',
    },
  },
  typography: commonTypography,
  shape: { borderRadius: 8 },
  components: sharedComponents(),
});
