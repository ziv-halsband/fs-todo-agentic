import { Button, type ButtonProps } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import AppleIcon from '@mui/icons-material/Apple';

interface OAuthButtonProps extends Omit<ButtonProps, 'children'> {
  provider: 'google' | 'apple';
}

const providerConfig = {
  google: {
    label: 'Continue with Google',
    icon: <GoogleIcon fontSize="small" />,
  },
  apple: {
    label: 'Continue with Apple',
    icon: <AppleIcon fontSize="small" />,
  },
};

export const OAuthButton = ({ provider, sx, ...props }: OAuthButtonProps) => {
  const config = providerConfig[provider];

  return (
    <Button
      variant="outlined"
      startIcon={config.icon}
      sx={{
        flex: 1,
        borderColor: '#E0E0E0',
        color: '#2D3436',
        borderRadius: '28px',
        padding: '10px 20px',
        fontWeight: 500,
        '&:hover': {
          borderColor: '#6C5CE7',
          backgroundColor: 'rgba(108, 92, 231, 0.04)',
        },
        ...sx,
      }}
      {...props}
    >
      {config.label}
    </Button>
  );
};
