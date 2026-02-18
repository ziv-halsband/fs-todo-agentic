import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import ChecklistIcon from '@mui/icons-material/Checklist';
import LogoutIcon from '@mui/icons-material/Logout';

import { en } from '../../i18n';
import { useAuthStore } from '../../store/authStore';
import styles from './AppHeader.module.scss';

const t = en;

export const AppHeader = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate('/login');
  };

  // Render sections
  const renderLogo = () => (
    <Box className={styles.leftSection}>
      <Box className={styles.logoIcon}>
        <ChecklistIcon sx={{ fontSize: 18, color: 'white' }} />
      </Box>
      <Typography variant="h6" component="div" fontWeight={700}>
        {t.app.name}
      </Typography>
    </Box>
  );

  const renderActions = () => (
    <Box className={styles.rightSection}>
      <IconButton size="small" sx={{ mr: 1 }}>
        <SettingsIcon fontSize="small" />
      </IconButton>
      <Avatar
        onClick={handleAvatarClick}
        sx={{ width: 36, height: 36, cursor: 'pointer', bgcolor: '#6C5CE7' }}
      >
        {user?.fullName?.charAt(0).toUpperCase()}
      </Avatar>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleLogout}>
          <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
          {t.app.logout}
        </MenuItem>
      </Menu>
    </Box>
  );

  // Main render
  return (
    <AppBar
      position="static"
      elevation={0}
      color="default"
      className={styles.appBar}
    >
      <Toolbar className={styles.toolbar}>
        {renderLogo()}
        {renderActions()}
      </Toolbar>
    </AppBar>
  );
};
