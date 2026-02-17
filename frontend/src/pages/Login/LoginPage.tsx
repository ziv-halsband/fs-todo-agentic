import { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Box, Divider, Link, Paper, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';

import { en } from '../../i18n';
import { login } from '../../services/authService';
import { ApiError } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { FormInput } from '../../components/FormInput';
import { GradientButton } from '../../components/GradientButton';
import { OAuthButton } from '../../components/OAuthButton';
import styles from './LoginPage.module.scss';

const t = en;

// Validation schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, t.validation.emailRequired)
    .email(t.validation.emailInvalid),
  password: z.string().min(1, t.validation.passwordRequired),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [apiError, setApiError] = useState<string | null>(null);
  const setUser = useAuthStore((state) => state.setUser);

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
      setUser(response.user);
      navigate('/dashboard');
    } catch (error) {
      if (error instanceof ApiError) {
        setApiError(error.message);
      } else {
        setApiError(t.common.genericError);
      }
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:3001/auth/google';
  };

  // Render sections
  const renderHeader = () => (
    <>
      <Box className={styles.iconWrapper}>
        <LockOutlinedIcon sx={{ fontSize: 32, color: '#6C5CE7' }} />
      </Box>
      <Typography
        variant="h5"
        component="h1"
        fontWeight={700}
        mb={1}
        align="center"
      >
        {t.login.heading}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        mb={3}
        lineHeight={1.4}
        align="center"
      >
        {t.login.subtitle}
      </Typography>
    </>
  );

  const renderAlerts = () => (
    <>
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
          {successMessage}
        </Alert>
      )}
      {apiError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {apiError}
        </Alert>
      )}
    </>
  );

  const renderForm = () => (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.fieldGroup}>
        <Typography variant="caption" fontWeight={600} mb={0.5}>
          {t.login.email}
        </Typography>
        <FormInput
          type="email"
          placeholder={t.login.emailPlaceholder}
          icon={<EmailOutlinedIcon color="action" />}
          error={!!errors.email}
          helperText={errors.email?.message}
          {...register('email')}
        />
      </div>

      <div className={styles.fieldGroup}>
        <Typography variant="caption" fontWeight={600} mb={0.5}>
          {t.login.password}
        </Typography>
        <FormInput
          type="password"
          placeholder={t.login.passwordPlaceholder}
          icon={<LockOutlinedIcon color="action" />}
          error={!!errors.password}
          helperText={errors.password?.message}
          {...register('password')}
        />
      </div>

      <GradientButton type="submit" loading={isSubmitting}>
        {t.login.signIn}
      </GradientButton>
    </form>
  );

  const renderOAuthSection = () => (
    <>
      <Divider sx={{ my: 3 }}>{t.login.continueWith}</Divider>
      <OAuthButton provider="google" onClick={handleGoogleLogin} fullWidth />
    </>
  );

  const renderFooter = () => (
    <Typography variant="body2" color="text.secondary" align="center" mt={3}>
      {t.login.noAccount}{' '}
      <Link
        component={RouterLink}
        to="/signup"
        underline="hover"
        color="primary"
        fontWeight={600}
      >
        {t.login.createAccount}
      </Link>
    </Typography>
  );

  // Main render
  return (
    <Box className={styles.page}>
      <Paper className={styles.card} elevation={3}>
        {renderHeader()}
        {renderAlerts()}
        {renderForm()}
        {renderOAuthSection()}
        {renderFooter()}
      </Paper>
    </Box>
  );
};
