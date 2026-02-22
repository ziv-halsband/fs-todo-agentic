import { useState, useEffect } from 'react';
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Badge,
} from '@mui/material';
import ChecklistIcon from '@mui/icons-material/Checklist';
import WorkIcon from '@mui/icons-material/Work';
import PersonIcon from '@mui/icons-material/Person';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import HomeIcon from '@mui/icons-material/Home';
import StarIcon from '@mui/icons-material/Star';
import SchoolIcon from '@mui/icons-material/School';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import AddIcon from '@mui/icons-material/Add';

import { en } from '../../i18n';
import { useTaskStore } from '../../store/taskStore';
import { useTodoStore } from '../../store/todoStore';
import { CreateListModal } from '../CreateListModal';
import styles from './AppSidebar.module.scss';

const t = en;

const listIconMap: Record<string, React.ReactNode> = {
  work: <WorkIcon fontSize="small" />,
  person: <PersonIcon fontSize="small" />,
  shopping_cart: <ShoppingCartIcon fontSize="small" />,
  list: <FormatListBulletedIcon fontSize="small" />,
  home: <HomeIcon fontSize="small" />,
  star: <StarIcon fontSize="small" />,
  school: <SchoolIcon fontSize="small" />,
  fitness: <FitnessCenterIcon fontSize="small" />,
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
  const { selectedListId, setSelectedList } = useTaskStore();
  const { lists, counts, fetchLists, fetchCounts } = useTodoStore();
  const [createListOpen, setCreateListOpen] = useState(false);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

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
        <IconButton size="small" onClick={() => setCreateListOpen(true)}>
          <AddIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>
      <List disablePadding>
        <ListItemButton
          selected={selectedListId === null}
          onClick={() => setSelectedList(null)}
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
            badgeContent={counts.total}
            color="default"
            className={styles.badge}
          />
        </ListItemButton>

        {lists.map((list) => (
          <ListItemButton
            key={list.id}
            selected={selectedListId === list.id}
            onClick={() => setSelectedList(list.id)}
            className={styles.listItem}
          >
            <ListItemIcon sx={{ minWidth: 36, color: list.color }}>
              {listIconMap[list.icon] ?? (
                <FormatListBulletedIcon fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText
              primary={list.name}
              primaryTypographyProps={{ variant: 'body2' }}
            />
            <Badge
              badgeContent={counts.byList[list.id] ?? 0}
              color="default"
              className={styles.badge}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <Drawer variant="permanent" className={styles.drawer}>
        <Box className={styles.sidebarContent}>
          {renderModules()}
          <Divider sx={{ my: 1 }} />
          {renderMyLists()}
        </Box>
      </Drawer>

      <CreateListModal
        open={createListOpen}
        onClose={() => setCreateListOpen(false)}
        onSaved={() => {
          setCreateListOpen(false);
          fetchLists();
        }}
      />
    </>
  );
};
