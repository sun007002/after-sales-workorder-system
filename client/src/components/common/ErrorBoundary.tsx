/**
 * ErrorBoundary — catches render errors anywhere in the child tree.
 *
 * Without this, a single thrown error during render causes React to unmount
 * the entire app, producing a blank white page with no clue about the cause.
 * This boundary shows a visible fallback (with the error message) and a
 * reload button, so runtime errors are diagnosable instead of silent.
 */
import React from 'react';
import { Box, Typography, Button } from '@mui/material';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Render error:', error, info.componentStack);
  }

  handleReload = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            p: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
            页面渲染出错
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, maxWidth: 600, wordBreak: 'break-word' }}
          >
            {this.state.error?.message || '发生未知错误'}
          </Typography>
          <Button variant="contained" onClick={this.handleReload}>
            刷新页面
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
