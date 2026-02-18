import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';

import { AppHeader } from '../AppHeader';
import { AppSidebar } from '../AppSidebar';
import styles from './AppLayout.module.scss';

export const AppLayout = () => {
  return (
    <Box className={styles.layout}>
      <Box className={styles.header}>
        <AppHeader />
      </Box>
      <Box className={styles.sidebar}>
        <AppSidebar />
      </Box>
      <Box className={styles.main}>
        <Outlet />
      </Box>
    </Box>
  );
};
