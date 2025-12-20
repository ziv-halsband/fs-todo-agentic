import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TextField, Button, Alert, Divider } from '@mui/material';

import { login } from '../../services/authService';
import { ApiError } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import styles from './LoginPage.module.scss';

// Zod schema - only email and password for login
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// TypeScript type from schema
type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [apiError, setApiError] = useState<string | null>(null);
  const setUser = useAuthStore((state) => state.setUser);

  // Get success message from signup redirect (if any)
  const successMessage = (location.state as { message?: string })?.message;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setApiError(null);

      const response = await login(data);
      setUser(response.user); // Store user in Zustand

      navigate('/dashboard');
    } catch (error) {
      if (error instanceof ApiError) {
        setApiError(error.message);
      } else {
        setApiError('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>Log in to your account</p>

        {/* Show success message from signup */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {/* Show API error if any */}
        {apiError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {apiError}
          </Alert>
        )}

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
          <TextField
            label="Email"
            type="email"
            variant="outlined"
            fullWidth
            error={!!errors.email}
            helperText={errors.email?.message}
            {...register('email')}
          />

          <TextField
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            error={!!errors.password}
            helperText={errors.password?.message}
            {...register('password')}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Logging in...' : 'Log In'}
          </Button>
        </form>

        <Divider sx={{ my: 2 }}>or</Divider>

        <Button
          variant="outlined"
          size="large"
          fullWidth
          onClick={() => {
            window.location.href = 'http://localhost:3001/auth/google';
          }}
        >
          Continue with Google
        </Button>

        <p className={styles.footer}>
          Don't have an account?{' '}
          <Link to="/signup" className={styles.link}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};
