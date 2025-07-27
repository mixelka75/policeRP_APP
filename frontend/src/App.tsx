// src/App.tsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';
import { Loading } from '@/components/ui';
import Login from '@/pages/Login';
import DiscordCallback from '@/pages/DiscordCallback';
import Dashboard from '@/pages/Dashboard';
import Passports from '@/pages/Passports';
import Fines from '@/pages/Fines';
import Emergency from '@/pages/Emergency';
import Users from '@/pages/Users';
import RoleManagement from '@/pages/RoleManagement';
import Logs from '@/pages/Logs';
import MyFines from '@/pages/MyFines';

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean; policeOrAdminOnly?: boolean }> = ({
  children,
  adminOnly = false,
  policeOrAdminOnly = false
}) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (policeOrAdminOnly && user?.role !== 'admin' && user?.role !== 'police') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

const App: React.FC = () => {
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return <Loading fullScreen text="Инициализация..." />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-minecraft-dark">
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* Discord callback route */}
          <Route
            path="/auth/callback"
            element={
              <PublicRoute>
                <DiscordCallback />
              </PublicRoute>
            }
          />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/passports"
            element={
              <ProtectedRoute policeOrAdminOnly>
                <Passports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fines"
            element={
              <ProtectedRoute policeOrAdminOnly>
                <Fines />
              </ProtectedRoute>
            }
          />
          <Route
            path="/emergency"
            element={
              <ProtectedRoute policeOrAdminOnly>
                <Emergency />
              </ProtectedRoute>
            }
          />

          {/* Citizen routes */}
          <Route
            path="/my-fines"
            element={
              <ProtectedRoute>
                <MyFines />
              </ProtectedRoute>
            }
          />

          {/* Admin only routes */}
          <Route
            path="/users"
            element={
              <ProtectedRoute adminOnly>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roles"
            element={
              <ProtectedRoute adminOnly>
                <RoleManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logs"
            element={
              <ProtectedRoute adminOnly>
                <Logs />
              </ProtectedRoute>
            }
          />

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#f3f4f6',
              border: '1px solid #374151',
            },
            success: {
              iconTheme: {
                primary: '#e879f9',
                secondary: '#f3f4f6',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#f3f4f6',
              },
            },
          }}
        />
      </div>
    </Router>
  );
};

export default App;