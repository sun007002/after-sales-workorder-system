import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { SnackbarProvider } from 'notistack';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import App from './App';
import ErrorBoundary from './components/common/ErrorBoundary';
import { lightTheme, darkTheme, ColorModeContext, type ColorMode } from './theme';
import './index.css';

// Set dayjs to Chinese locale so DatePicker shows Chinese months/weekdays.
dayjs.locale('zh-cn');

/** localStorage key for persisting the color mode. */
const COLOR_MODE_KEY = 'workorder-color-mode';

/**
 * Reads the initial color mode from localStorage, falling back to the
 * system preference (prefers-color-scheme) and finally to 'light'.
 */
function getInitialMode(): ColorMode {
  const stored = localStorage.getItem(COLOR_MODE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  if (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark';
  }
  return 'light';
}

/**
 * Root component that manages color mode state and provides the
 * ThemeProvider, LocalizationProvider, and SnackbarProvider to the app.
 */
const Root: React.FC = () => {
  const [mode, setMode] = useState<ColorMode>(getInitialMode);

  const toggle = () => {
    setMode((prev) => {
      const next: ColorMode = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(COLOR_MODE_KEY, next);
      return next;
    });
  };

  const theme = mode === 'dark' ? darkTheme : lightTheme;

  return (
    <ColorModeContext.Provider value={{ mode, toggle }}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="zh-cn">
            <SnackbarProvider
              maxSnack={3}
              anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
              autoHideDuration={3000}
            >
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
            </SnackbarProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ColorModeContext.Provider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
