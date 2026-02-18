import { useState, useCallback } from 'react';
import {
  Box,
  Collapse,
  FormControl,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';
import {
  mockGetLists,
  mockGetTasks,
  mockToggleTaskComplete,
} from '../../services/mockTodoApi';
import { TaskItem } from '../../components/TaskItem';
import styles from './TasksPage.module.scss';

type StatusFilter = 'all' | 'open' | 'completed';
type PriorityFilter = 'all' | 'high' | 'medium' | 'low';

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export const TasksPage = () => {
  const user = useAuthStore((s) => s.user);
  const { selectedListId, searchTerm, setSearchTerm } = useTaskStore();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [completedExpanded, setCompletedExpanded] = useState(true);
  const [, setRevision] = useState(0);

  const firstName = user?.fullName?.split(' ')[0] ?? 'there';

  const allTasks = mockGetTasks({ listId: selectedListId, searchTerm });

  const activeTasks = allTasks
    .filter((t) => !t.completed)
    .filter((t) => priorityFilter === 'all' || t.priority === priorityFilter);

  const completedTasks = allTasks
    .filter((t) => t.completed)
    .filter((t) => priorityFilter === 'all' || t.priority === priorityFilter);

  const showActive = statusFilter !== 'completed';
  const showCompleted = statusFilter !== 'open';

  const hasContent =
    (showActive && activeTasks.length > 0) ||
    (showCompleted && completedTasks.length > 0);

  const sectionTitle = selectedListId
    ? (mockGetLists().find((l) => l.id === selectedListId)?.name ?? 'Tasks')
    : "Today's Tasks";

  const handleToggleComplete = useCallback((id: string) => {
    mockToggleTaskComplete(id);
    setRevision((r) => r + 1);
  }, []);

  return (
    <Box className={styles.page}>
      <Box className={styles.greeting}>
        <Typography variant="h5" fontWeight={700}>
          {getGreeting()}, {firstName}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Here is your agenda for today.
        </Typography>
      </Box>

      <Box className={styles.toolbar}>
        <TextField
          placeholder="Search tasks..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchBar}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: '#9E9E9E' }} />
              </InputAdornment>
            ),
          }}
        />

        <FormControl size="small" sx={{ minWidth: 148 }}>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            renderValue={(v) =>
              `Status: ${v === 'all' ? 'All' : v === 'open' ? 'Open' : 'Completed'}`
            }
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="open">Open</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 148 }}>
          <Select
            value={priorityFilter}
            onChange={(e) =>
              setPriorityFilter(e.target.value as PriorityFilter)
            }
            renderValue={(v) =>
              `Priority: ${v === 'all' ? 'All' : v.charAt(0).toUpperCase() + v.slice(1)}`
            }
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="low">Low</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box className={styles.listSection}>
        <Box className={styles.sectionHeader}>
          <Typography variant="subtitle1" fontWeight={700}>
            {sectionTitle}
          </Typography>
        </Box>

        {!hasContent && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ py: 6, textAlign: 'center' }}
          >
            No tasks found
          </Typography>
        )}

        {showActive &&
          activeTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleComplete={handleToggleComplete}
            />
          ))}

        {showCompleted && completedTasks.length > 0 && (
          <Box className={styles.completedSection}>
            <Box
              className={styles.completedHeader}
              onClick={() => setCompletedExpanded((v) => !v)}
            >
              {completedExpanded ? (
                <ExpandLessIcon fontSize="small" />
              ) : (
                <ExpandMoreIcon fontSize="small" />
              )}
              <Typography variant="body2" color="text.secondary">
                Completed ({completedTasks.length})
              </Typography>
            </Box>
            <Collapse in={completedExpanded}>
              {completedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggleComplete={handleToggleComplete}
                />
              ))}
            </Collapse>
          </Box>
        )}
      </Box>
    </Box>
  );
};
