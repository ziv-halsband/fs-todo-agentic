import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/Login';
import { SignupPage } from './pages/Signup';
import { TasksPage } from './pages/Tasks';
import { useAuthStore } from './store/authStore';

function App() {
  const { isLoading, isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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
      <Route
        path="/"
        element={
          <Navigate to={isAuthenticated ? '/tasks' : '/login'} replace />
        }
      />

      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/tasks" replace /> : <LoginPage />
        }
      />
      <Route
        path="/signup"
        element={
          isAuthenticated ? <Navigate to="/tasks" replace /> : <SignupPage />
        }
      />

      {/* Dashboard with AppLayout */}
      <Route
        path="/tasks"
        element={
          isAuthenticated ? <AppLayout /> : <Navigate to="/login" replace />
        }
      >
        <Route index element={<TasksPage />} />
      </Route>
    </Routes>
  );
}

export default App;
