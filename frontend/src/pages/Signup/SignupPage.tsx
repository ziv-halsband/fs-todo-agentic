import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Divider, Link, Typography } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

import { en } from '../../i18n';
import { signup } from '../../services/authService';
import { ApiError } from '../../services/api';
import { AuthLayout } from '../../components/AuthLayout';
import { FormInput } from '../../components/FormInput';
import { GradientButton } from '../../components/GradientButton';
import { OAuthButton } from '../../components/OAuthButton';
import familyImg from '../../assets/family-illustration.png';
import styles from './SignupPage.module.scss';

const t = en;
// --- Validation schema ---
const signupSchema = z.object({
  fullName: z
    .string()
    .min(1, t.validation.fullNameRequired)
    .min(2, t.validation.fullNameMin),
  email: z
    .string()
    .min(1, t.validation.emailRequired)
    .email(t.validation.emailInvalid),
  password: z
    .string()
    .min(1, t.validation.passwordRequired)
    .min(8, t.validation.passwordMin),
});

type SignupFormData = z.infer<typeof signupSchema>;

export const SignupPage = () => {
  // Hooks
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  // Handlers
  const onSubmit = async (data: SignupFormData) => {
    try {
      setApiError(null);
      await signup(data);
      navigate('/login', {
        state: { message: t.signup.successRedirect },
      });
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
  const renderHeading = () => (
    <>
      <Typography
        variant="h5"
        component="h1"
        fontWeight={700}
        mb={1}
        align="center"
      >
        {t.signup.heading}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        mb={3}
        lineHeight={1.4}
        align="center"
      >
        {t.signup.subtitle}
      </Typography>
    </>
  );

  const renderOAuthButtons = () => (
    <>
      <OAuthButton
        provider="google"
        onClick={handleGoogleLogin}
        fullWidth
        sx={{ mb: 3 }}
      />
      <Divider sx={{ mb: 3 }}>{t.common.or}</Divider>
    </>
  );

  const renderError = () =>
    apiError ? (
      <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
        {apiError}
      </Alert>
    ) : null;

  const renderForm = () => (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.fieldGroup}>
        <Typography variant="caption" fontWeight={600} mb={0.5}>
          {t.signup.fullName}
        </Typography>
        <FormInput
          placeholder={t.signup.fullNamePlaceholder}
          icon={<PersonOutlineIcon color="action" />}
          error={!!errors.fullName}
          helperText={errors.fullName?.message}
          {...register('fullName')}
        />
      </div>

      <div className={styles.fieldGroup}>
        <Typography variant="caption" fontWeight={600} mb={0.5}>
          {t.signup.email}
        </Typography>
        <FormInput
          type="email"
          placeholder={t.signup.emailPlaceholder}
          icon={<EmailOutlinedIcon color="action" />}
          error={!!errors.email}
          helperText={errors.email?.message}
          {...register('email')}
        />
      </div>

      <div className={styles.fieldGroup}>
        <Typography variant="caption" fontWeight={600} mb={0.5}>
          {t.signup.password}
        </Typography>
        <FormInput
          type="password"
          placeholder={t.signup.passwordPlaceholder}
          icon={<LockOutlinedIcon color="action" />}
          error={!!errors.password}
          helperText={errors.password?.message}
          {...register('password')}
        />
      </div>

      <GradientButton type="submit" loading={isSubmitting}>
        {t.signup.createAccount}
      </GradientButton>
    </form>
  );

  const renderFooter = () => (
    <>
      <Typography variant="body2" color="text.secondary" align="center" mt={3}>
        {t.signup.alreadyHaveAccount}{' '}
        <Link
          component={RouterLink}
          to="/login"
          underline="hover"
          color="primary"
          fontWeight={600}
        >
          {t.signup.logIn}
        </Link>
      </Typography>
      <Typography
        variant="caption"
        color="secondary.light"
        align="center"
        display="block"
        mt={2.5}
        lineHeight={1.5}
      >
        {t.common.termsPrefix}{' '}
        <Link href="#" underline="always" color="primary">
          {t.common.termsOfService}
        </Link>{' '}
        {t.common.and}{' '}
        <Link href="#" underline="always" color="primary">
          {t.common.privacyPolicy}
        </Link>
        .
      </Typography>
    </>
  );

  // Main render
  return (
    <AuthLayout
      mobileTitle={t.signup.mobileTitle}
      illustrationSrc={familyImg}
      showHomeLink={false}
      showBackButton={false}
    >
      {renderHeading()}
      {renderOAuthButtons()}
      {renderError()}
      {renderForm()}
      {renderFooter()}
    </AuthLayout>
  );
};
