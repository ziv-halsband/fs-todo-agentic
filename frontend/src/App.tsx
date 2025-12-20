import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { DashboardPage } from './pages/Dashboard';
import { LoginPage } from './pages/Login';
import { SignupPage } from './pages/Signup';
import { useAuthStore } from './store/authStore';

function App() {
  const { isLoading, isAuthenticated, checkAuth } = useAuthStore();

  // On app load, check if user is already logged in
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      {/* Redirect root based on auth status */}
      <Route
        path="/"
        element={
          <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
        }
      />

      {/* Public routes - redirect to dashboard if already logged in */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />
      <Route
        path="/signup"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <SignupPage />
          )
        }
      />

      {/* Protected route - redirect to login if not authenticated */}
      <Route
        path="/dashboard"
        element={
          isAuthenticated ? <DashboardPage /> : <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
}

export default App;
