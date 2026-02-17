import { createTheme } from '@mui/material/styles';

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6C5CE7',
      light: '#A29BFE',
      dark: '#5A4BD1',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#636E72',
      light: '#B2BEC3',
      dark: '#2D3436',
    },
    background: {
      default: '#FFFFFF',
      paper: '#F8F7FF',
    },
    text: {
      primary: '#2D3436',
      secondary: '#636E72',
    },
    divider: '#E0E0E0',
  },
  typography: {
    fontFamily:
      '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 700,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#636E72',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        fullWidth: true,
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: '#F5F5F7',
            '& fieldset': {
              borderColor: 'transparent',
            },
            '&:hover fieldset': {
              borderColor: '#6C5CE7',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#6C5CE7',
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 24px',
          fontSize: '1rem',
        },
        outlined: {
          borderColor: '#E0E0E0',
          color: '#2D3436',
          '&:hover': {
            borderColor: '#6C5CE7',
            backgroundColor: 'rgba(108, 92, 231, 0.04)',
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          fontSize: '0.75rem',
          color: '#636E72',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        },
      },
    },
  },
});

export { lightTheme };
