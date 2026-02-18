import { useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import ChecklistIcon from '@mui/icons-material/Checklist';
import WorkIcon from '@mui/icons-material/Work';
import PersonIcon from '@mui/icons-material/Person';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import AddIcon from '@mui/icons-material/Add';

import { en } from '../../i18n';
import { useTaskStore } from '../../store/taskStore';
import {
  mockGetLists,
  mockGetTasks,
  type List as TaskList,
} from '../../services/mockTodoApi';
import styles from './AppSidebar.module.scss';

const t = en;

const listIconMap: Record<string, React.ReactNode> = {
  work: <WorkIcon fontSize="small" />,
  person: <PersonIcon fontSize="small" />,
  shopping_cart: <ShoppingCartIcon fontSize="small" />,
};

const modules = [
  {
    id: 'tasks',
    label: 'Tasks',
    icon: <ChecklistIcon fontSize="small" />,
    active: true,
  },
  {
    id: 'family',
    label: 'Family Portfolio',
    icon: <AccountTreeIcon fontSize="small" />,
    active: false,
  },
  {
    id: 'expenses',
    label: 'Expenses',
    icon: <AttachMoneyIcon fontSize="small" />,
    active: false,
  },
  {
    id: 'more',
    label: 'More',
    icon: <MoreHorizIcon fontSize="small" />,
    active: false,
  },
];

export const AppSidebar = () => {
  const [lists, setLists] = useState<TaskList[]>([]);
  const { selectedListId, setSelectedList, resetFilter } = useTaskStore();

  useEffect(() => {
    const data = mockGetLists();
    setLists(data);
  }, []);

  const handleListClick = (listId: string | null) => {
    setSelectedList(listId);
    resetFilter();
  };

  const getIncompleteCount = (listId?: string) => {
    return mockGetTasks({ listId, filter: 'todo' }).length;
  };

  // Render sections
  const renderModules = () => (
    <Box className={styles.section}>
      <Typography variant="caption" className={styles.sectionLabel}>
        MODULES
      </Typography>
      <List disablePadding>
        {modules.map((mod) => (
          <ListItemButton
            key={mod.id}
            disabled={!mod.active}
            selected={mod.active}
            className={styles.navItem}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>{mod.icon}</ListItemIcon>
            <ListItemText
              primary={mod.label}
              primaryTypographyProps={{
                variant: 'body2',
                fontWeight: mod.active ? 600 : 400,
              }}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  const renderMyLists = () => (
    <Box className={styles.section}>
      <Box className={styles.listsHeader}>
        <Typography variant="caption" className={styles.sectionLabel}>
          {t.tasks.myLists}
        </Typography>
        <IconButton size="small" disabled>
          <AddIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>
      <List disablePadding>
        <ListItemButton
          selected={selectedListId === null}
          onClick={() => handleListClick(null)}
          className={styles.listItem}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <FormatListBulletedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={t.tasks.allTasks}
            primaryTypographyProps={{ variant: 'body2' }}
          />
          <Badge
            badgeContent={getIncompleteCount()}
            color="default"
            className={styles.badge}
          />
        </ListItemButton>

        {lists.map((list) => (
          <ListItemButton
            key={list.id}
            selected={selectedListId === list.id}
            onClick={() => handleListClick(list.id)}
            className={styles.listItem}
          >
            <ListItemIcon sx={{ minWidth: 36, color: list.color }}>
              {listIconMap[list.icon]}
            </ListItemIcon>
            <ListItemText
              primary={list.name}
              primaryTypographyProps={{ variant: 'body2' }}
            />
            <Badge
              badgeContent={getIncompleteCount(list.id)}
              color="default"
              className={styles.badge}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  // Main render
  return (
    <Drawer variant="permanent" className={styles.drawer}>
      <Box className={styles.sidebarContent}>
        {renderModules()}
        <Divider sx={{ my: 1 }} />
        {renderMyLists()}
      </Box>
    </Drawer>
  );
};
