import { Box, Typography } from '@mui/material';

interface EmptyStateProps {
  message?: string;
}

export const EmptyState = ({ message = 'No tasks found' }: EmptyStateProps) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      py: 8,
      gap: 2,
      color: 'text.disabled',
    }}
  >
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="14" y="10" width="52" height="62" rx="6" fill="#F0F0F5" />
      <rect
        x="14"
        y="10"
        width="52"
        height="62"
        rx="6"
        stroke="#D1D1E0"
        strokeWidth="2"
      />
      <rect x="28" y="6" width="24" height="10" rx="5" fill="#D1D1E0" />
      <rect x="24" y="30" width="32" height="4" rx="2" fill="#D1D1E0" />
      <rect x="24" y="40" width="24" height="4" rx="2" fill="#D1D1E0" />
      <rect x="24" y="50" width="16" height="4" rx="2" fill="#D1D1E0" />
    </svg>
    <Typography variant="body2" color="text.disabled">
      {message}
    </Typography>
  </Box>
);
