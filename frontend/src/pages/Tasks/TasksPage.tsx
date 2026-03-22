import { useEffect, useState, useCallback } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Fab,
  FormControl,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';

import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';
import { useTodoStore } from '../../store/todoStore';
import { useTodosQuery } from '../../hooks/useTodosQuery';
import { useDualTodosQuery } from '../../hooks/useDualTodosQuery';
import { useDebounce } from '../../hooks/useDebounce';
import { TaskSection } from '../../components/TaskSection';
import { EmptyState } from '../../components/EmptyState';
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
  const [openPage, setOpenPage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const [completedExpanded, setCompletedExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  const firstName = user?.fullName?.split(' ')[0] ?? 'there';
  const debouncedSearch = useDebounce(searchTerm, 400);
  const isSearchPending = searchTerm !== debouncedSearch;

  const isDualMode = statusFilter === 'all';

  const baseFilters = {
    ...(selectedListId && { listId: selectedListId }),
    ...(priorityFilter !== 'all' && { priority: priorityFilter }),
    ...(debouncedSearch && { search: debouncedSearch }),
  };

  // Dual mode: two independent queries for open + completed
  const dual = useDualTodosQuery(
    baseFilters,
    openPage,
    completedPage,
    PAGE_SIZE,
    isDualMode
  );

  // Single mode: one query for either open or completed
  const singleFilters = {
    ...baseFilters,
    ...(statusFilter === 'open' && { completed: false }),
    ...(statusFilter === 'completed' && { completed: true }),
    page: openPage,
    limit: PAGE_SIZE,
  };
  const {
    data: singleData,
    isLoading: singleLoading,
    isError: singleError,
  } = useTodosQuery(singleFilters, !isDualMode);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  useEffect(() => {
    setOpenPage(1);
    setCompletedPage(1);
  }, [selectedListId, statusFilter, priorityFilter, debouncedSearch]);

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

  // Derive display values based on mode
  const isLoading = isDualMode
    ? dual.open.isLoading && dual.completed.isLoading
    : singleLoading;
  const isError = isDualMode
    ? dual.open.isError || dual.completed.isError
    : singleError;
  const totalCount = isDualMode
    ? dual.open.total + dual.completed.total
    : (singleData?.total ?? 0);
  const hasContent = isDualMode
    ? dual.open.todos.length > 0 || dual.completed.todos.length > 0
    : (singleData?.todos.length ?? 0) > 0;

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
            setOpenPage(1);
            setCompletedPage(1);
          }}
          className={styles.searchBar}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: '#9E9E9E' }} />
              </InputAdornment>
            ),
            endAdornment: isSearchPending ? (
              <InputAdornment position="end">
                <CircularProgress size={16} thickness={5} />
              </InputAdornment>
            ) : undefined,
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
          {totalCount > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              ({totalCount} total)
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
          <EmptyState
            message={
              debouncedSearch
                ? `No results for "${debouncedSearch}"`
                : 'No tasks found'
            }
          />
        )}

        {!isLoading && !isError && isDualMode && (
          <>
            <TaskSection
              tasks={dual.open.todos}
              total={dual.open.total}
              page={openPage}
              pageSize={PAGE_SIZE}
              onPageChange={setOpenPage}
              onToggleComplete={handleToggleComplete}
              onEdit={handleOpenEdit}
              isLoading={dual.open.isLoading}
            />
            <TaskSection
              tasks={dual.completed.todos}
              total={dual.completed.total}
              page={completedPage}
              pageSize={PAGE_SIZE}
              onPageChange={setCompletedPage}
              onToggleComplete={handleToggleComplete}
              onEdit={handleOpenEdit}
              isLoading={dual.completed.isLoading}
              collapsible
              collapsed={!completedExpanded}
              onToggleCollapse={() => setCompletedExpanded((v) => !v)}
              label="Completed"
            />
          </>
        )}

        {!isLoading && !isError && !isDualMode && singleData && (
          <TaskSection
            tasks={singleData.todos}
            total={singleData.total}
            page={openPage}
            pageSize={PAGE_SIZE}
            onPageChange={setOpenPage}
            onToggleComplete={handleToggleComplete}
            onEdit={handleOpenEdit}
            isLoading={singleLoading}
          />
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
