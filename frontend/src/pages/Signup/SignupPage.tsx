import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TextField, Button, Alert, Divider } from '@mui/material';

import { signup } from '../../services/authService';
import { ApiError } from '../../services/api';
import styles from './SignupPage.module.scss';

// Zod schema - defines validation rules
const signupSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

// TypeScript type - auto-generated from schema!
type SignupFormData = z.infer<typeof signupSchema>;

export const SignupPage = () => {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      setApiError(null); // Clear previous errors

      await signup(data);

      // Success! Redirect to login page
      navigate('/login', {
        state: { message: 'Account created! Please log in.' },
      });
    } catch (error) {
      // Handle API errors
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
        <h1 className={styles.title}>Create Account</h1>
        <p className={styles.subtitle}>Sign up to get started</p>

        {/* Show API error if any */}
        {apiError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {apiError}
          </Alert>
        )}

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
          <TextField
            label="Full Name"
            variant="outlined"
            fullWidth
            error={!!errors.fullName}
            helperText={errors.fullName?.message}
            {...register('fullName')}
          />

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
            {isSubmitting ? 'Signing up...' : 'Sign Up'}
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
          Already have an account?{' '}
          <Link to="/login" className={styles.link}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};
