import { useEffect, useState, useCallback } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Collapse,
  Fab,
  FormControl,
  InputAdornment,
  MenuItem,
  Pagination,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';
import { useTodoStore } from '../../store/todoStore';
import { useTodosQuery } from '../../hooks/useTodosQuery';
import { useDebounce } from '../../hooks/useDebounce';
import { TaskItem } from '../../components/TaskItem';
import { TaskFormModal } from '../../components/TaskFormModal';
import type { Task } from '../../services/todoService';
import styles from './TasksPage.module.scss';

type StatusFilter = 'all' | 'open' | 'completed';
type PriorityFilter = 'all' | 'high' | 'medium' | 'low';

const PAGE_SIZE = 20;

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export const TasksPage = () => {
  const user = useAuthStore((s) => s.user);
  const { selectedListId, searchTerm, setSearchTerm } = useTaskStore();
  const { lists, fetchLists } = useTodoStore();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [page, setPage] = useState(1);
  const [completedExpanded, setCompletedExpanded] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  const firstName = user?.fullName?.split(' ')[0] ?? 'there';

  // Debounce search — input updates instantly, but the query key
  // (and therefore the API call) only changes after 2 seconds of inactivity.
  const debouncedSearch = useDebounce(searchTerm, 2000);

  // Build query params from current filter state.
  const filters = {
    ...(selectedListId && { listId: selectedListId }),
    ...(statusFilter === 'open' && { completed: false }),
    ...(statusFilter === 'completed' && { completed: true }),
    ...(priorityFilter !== 'all' && { priority: priorityFilter }),
    ...(debouncedSearch && { search: debouncedSearch }),
    page,
    limit: PAGE_SIZE,
  };

  const { data, isLoading, isError } = useTodosQuery(filters);

  const todos = data?.todos ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.ceil(total / PAGE_SIZE);

  // Load lists once on mount.
  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  // Reset page when any filter (except page itself) changes.
  useEffect(() => {
    setPage(1);
  }, [selectedListId, statusFilter, priorityFilter, debouncedSearch]);

  const activeTasks = todos.filter((t) => !t.completed);
  const completedTasks = todos.filter((t) => t.completed);
  const hasContent = todos.length > 0;
  const showCompleted = statusFilter !== 'open';

  const sectionTitle = selectedListId
    ? (lists.find((l) => l.id === selectedListId)?.name ?? 'Tasks')
    : 'All Tasks';

  const { toggleComplete } = useTodoStore();

  const handleToggleComplete = useCallback(
    (id: string, listId: string, currentCompleted: boolean) =>
      toggleComplete(id, listId, currentCompleted),
    [toggleComplete]
  );

  const handleOpenEdit = useCallback((task: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  }, []);

  const handleSaved = () => {
    setModalOpen(false);
    setEditingTask(undefined);
  };

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
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
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
            onChange={(e) => {
              setStatusFilter(e.target.value as StatusFilter);
              setPage(1);
            }}
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
            onChange={(e) => {
              setPriorityFilter(e.target.value as PriorityFilter);
              setPage(1);
            }}
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
          {total > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              ({total} total)
            </Typography>
          )}
        </Box>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        )}

        {!isLoading && isError && (
          <Alert severity="error" sx={{ my: 2 }}>
            Failed to load tasks
          </Alert>
        )}

        {!isLoading && !isError && !hasContent && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ py: 6, textAlign: 'center' }}
          >
            No tasks found
          </Typography>
        )}

        {!isLoading &&
          statusFilter !== 'completed' &&
          activeTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleComplete={handleToggleComplete}
              onEdit={handleOpenEdit}
            />
          ))}

        {!isLoading && showCompleted && completedTasks.length > 0 && (
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
                  onEdit={handleOpenEdit}
                />
              ))}
            </Collapse>
          </Box>
        )}

        {!isLoading && pageCount > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 3, pb: 1 }}>
            <Pagination
              count={pageCount}
              page={page}
              onChange={(_, value) => setPage(value)}
              size="small"
              color="primary"
            />
          </Box>
        )}
      </Box>

      <Fab
        color="primary"
        aria-label="add task"
        onClick={() => {
          setEditingTask(undefined);
          setModalOpen(true);
        }}
        sx={{ position: 'fixed', bottom: 32, right: 32 }}
      >
        <AddIcon />
      </Fab>

      <TaskFormModal
        open={modalOpen}
        task={editingTask}
        defaultListId={selectedListId}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(undefined);
        }}
        onSaved={handleSaved}
      />
    </Box>
  );
};
