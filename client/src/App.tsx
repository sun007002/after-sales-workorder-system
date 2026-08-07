/**
 * Root application component.
 * Sets up routing, layout selection (PC/Mobile), and route guards.
 */
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useMediaQuery, useTheme, CircularProgress, Box } from '@mui/material';
import { useAuthStore } from './store/authStore';
import MainLayout from './components/layout/MainLayout';
import MobileLayout from './components/layout/MobileLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WorkOrderListPage from './pages/WorkOrderListPage';
import WorkOrderFormPage from './pages/WorkOrderFormPage';
import WorkOrderDetailPage from './pages/WorkOrderDetailPage';
import StaffPage from './pages/StaffPage';
import CustomerPage from './pages/CustomerPage';
import SummaryPage from './pages/SummaryPage';
import UserPage from './pages/UserPage';
import RolePage from './pages/RolePage';

/** Props for the protected layout wrapper. */
interface LayoutWrapperProps {
  children: React.ReactNode;
}

/**
 * Layout wrapper that selects PC or Mobile layout based on screen width.
 */
const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  return isMobile ? (
    <MobileLayout>{children}</MobileLayout>
  ) : (
    <MainLayout>{children}</MainLayout>
  );
};

/** Props for the protected route wrapper. */
interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Route guard: redirects to login if not authenticated.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

/**
 * Public route: redirects to dashboard if already authenticated.
 */
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

/**
 * Root application with routing configuration.
 */
const App: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Protected routes with layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <DashboardPage />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/work-orders"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <WorkOrderListPage />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/work-orders/new"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <WorkOrderFormPage />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/work-orders/:id/edit"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <WorkOrderFormPage />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/work-orders/:id"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <WorkOrderDetailPage />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <StaffPage />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <CustomerPage />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/summary"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <SummaryPage />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <UserPage />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/roles"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <RolePage />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />

      {/* Fallback redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
