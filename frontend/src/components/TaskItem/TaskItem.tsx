import { Box, Checkbox, Chip, Typography } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

import type { Task } from '../../services/todoService';
import styles from './TaskItem.module.scss';

const PRIORITY_CONFIG = {
  high: { label: 'HIGH', color: '#C0392B', bg: '#FFEAEA' },
  medium: { label: 'MEDIUM', color: '#D97706', bg: '#FFF3CD' },
  low: { label: 'LOW', color: '#27AE60', bg: '#E8F8F0' },
} as const;

const formatDueDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const taskDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (taskDay.getTime() === today.getTime()) {
    const hours = date.getHours();
    if (hours === 0) return 'Today';
    return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}`;
  }
  if (taskDay.getTime() === tomorrow.getTime()) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

interface Props {
  task: Task;
  onToggleComplete: (
    id: string,
    listId: string,
    currentCompleted: boolean
  ) => void;
  onEdit: (task: Task) => void;
}

export const TaskItem = ({ task, onToggleComplete, onEdit }: Props) => {
  const priority = PRIORITY_CONFIG[task.priority];

  return (
    <Box
      className={`${styles.row} ${task.completed ? styles.completedRow : ''}`}
      onClick={() => onEdit(task)}
    >
      <Box onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={task.completed}
          onChange={() =>
            onToggleComplete(task.id, task.listId, task.completed)
          }
          size="small"
          sx={{
            color: '#BDBDBD',
            padding: '4px',
            '&.Mui-checked': { color: '#00B894' },
          }}
        />
      </Box>

      <Box className={styles.titleGroup}>
        <Typography
          variant="body2"
          sx={{
            textDecoration: task.completed ? 'line-through' : 'none',
            color: task.completed ? '#9E9E9E' : '#212121',
            fontWeight: 500,
          }}
        >
          {task.title}
        </Typography>
        <Chip
          label={priority.label}
          size="small"
          sx={{
            height: 20,
            fontSize: 11,
            fontWeight: 700,
            backgroundColor: priority.bg,
            color: priority.color,
            borderRadius: '4px',
            ml: 1.5,
            letterSpacing: '0.3px',
          }}
        />
      </Box>

      {task.dueDate && (
        <Box className={styles.dueDate}>
          <CalendarTodayIcon sx={{ fontSize: 12, mr: 0.5, color: '#9E9E9E' }} />
          <Typography variant="caption" color="text.secondary">
            {formatDueDate(task.dueDate)}
          </Typography>
        </Box>
      )}
    </Box>
  );
};
