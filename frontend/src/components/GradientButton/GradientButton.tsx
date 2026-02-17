import { Button, type ButtonProps, CircularProgress } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

interface GradientButtonProps extends ButtonProps {
  loading?: boolean;
  showArrow?: boolean;
}

export const GradientButton = ({
  children,
  loading = false,
  showArrow = true,
  disabled,
  sx,
  ...props
}: GradientButtonProps) => {
  return (
    <Button
      {...props}
      disabled={disabled || loading}
      fullWidth
      sx={{
        background: 'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)',
        color: '#FFFFFF',
        fontWeight: 600,
        fontSize: '1rem',
        padding: '14px 24px',
        borderRadius: '28px',
        '&:hover': {
          background: 'linear-gradient(135deg, #5A4BD1 0%, #8B80F0 100%)',
        },
        '&:disabled': {
          background: '#E0E0E0',
          color: '#9E9E9E',
        },
        ...sx,
      }}
      endIcon={
        loading ? (
          <CircularProgress size={20} color="inherit" />
        ) : showArrow ? (
          <ArrowForwardIcon />
        ) : undefined
      }
    >
      {loading ? 'Please wait...' : children}
    </Button>
  );
};
