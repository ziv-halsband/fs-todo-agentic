import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, IconButton, Link, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { en } from '../../i18n';
import styles from './AuthLayout.module.scss';

const t = en;

interface AuthLayoutProps {
  children: ReactNode;
  mobileTitle: string;
  illustrationSrc?: string;
  showBackButton?: boolean;
  showHomeLink?: boolean;
}

export const AuthLayout = ({
  children,
  mobileTitle,
  illustrationSrc,
  showBackButton = true,
  showHomeLink = true,
}: AuthLayoutProps) => {
  const navigate = useNavigate();

  // Render sections
  const renderLeftPanel = () => (
    <div className={styles.leftPanel}>
      {illustrationSrc && (
        <Box
          component="img"
          src={illustrationSrc}
          alt="Illustration"
          className={styles.illustration}
        />
      )}
      <Typography
        variant="h5"
        component="h2"
        color="primary"
        fontWeight={700}
        mb={2}
      >
        {t.authLayout.testimonialHeading}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ maxWidth: 320, mb: 3, lineHeight: 1.6 }}
      >
        {t.authLayout.testimonialQuote}
      </Typography>
      <div className={styles.socialProof}>
        <div className={styles.dots}>
          <span className={`${styles.dot} ${styles.active}`} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
        <Typography variant="caption" color="text.secondary">
          {t.authLayout.socialProof}
        </Typography>
      </div>
    </div>
  );

  const renderDesktopHeader = () => (
    <div className={styles.desktopHeader}>
      {showHomeLink && (
        <Link
          href="/"
          underline="hover"
          color="primary"
          fontSize="0.9rem"
          fontWeight={500}
        >
          {t.common.backToHome}
        </Link>
      )}
    </div>
  );

  const renderMobileHeader = () => (
    <div className={styles.mobileHeader}>
      {showBackButton && (
        <IconButton
          className={styles.backButton}
          onClick={() => navigate(-1)}
          size="small"
        >
          <ArrowBackIcon />
        </IconButton>
      )}
      <Typography variant="body1" fontWeight={600}>
        {mobileTitle}
      </Typography>
    </div>
  );

  const renderMobileIllustration = () =>
    illustrationSrc ? (
      <Box
        component="img"
        src={illustrationSrc}
        alt="Illustration"
        className={styles.mobileIllustration}
      />
    ) : null;

  // Main render
  return (
    <div className={styles.layout}>
      {renderLeftPanel()}

      <div className={styles.rightPanel}>
        <div className={styles.formContainer}>
          {renderDesktopHeader()}
          {renderMobileHeader()}
          {renderMobileIllustration()}
          {children}
        </div>
      </div>
    </div>
  );
};
