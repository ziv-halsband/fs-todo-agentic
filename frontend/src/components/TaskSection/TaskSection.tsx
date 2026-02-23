import { Box, Collapse, Pagination, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

import { TaskItem } from '../TaskItem';
import type { Task } from '../../services/todoService';
import styles from './TaskSection.module.scss';

interface TaskSectionProps {
  tasks: Task[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onToggleComplete: (id: string, listId: string, current: boolean) => void;
  onEdit: (task: Task) => void;
  isLoading: boolean;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  label?: string;
}

export const TaskSection = ({
  tasks,
  total,
  page,
  pageSize,
  onPageChange,
  onToggleComplete,
  onEdit,
  isLoading,
  collapsible = false,
  collapsed = false,
  onToggleCollapse,
  label,
}: TaskSectionProps) => {
  if (isLoading || (tasks.length === 0 && total === 0)) return null;

  const pageCount = Math.ceil(total / pageSize);

  const taskList = (
    <>
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggleComplete={onToggleComplete}
          onEdit={onEdit}
        />
      ))}
      {pageCount > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2, pb: 1 }}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_, value) => onPageChange(value)}
            size="small"
            color="primary"
          />
        </Box>
      )}
    </>
  );

  if (!collapsible) return <>{taskList}</>;

  return (
    <Box className={styles.section}>
      <Box className={styles.header} onClick={onToggleCollapse}>
        {collapsed ? (
          <ExpandMoreIcon fontSize="small" />
        ) : (
          <ExpandLessIcon fontSize="small" />
        )}
        <Typography variant="body2" color="text.secondary">
          {label ?? 'Completed'} ({total})
        </Typography>
      </Box>
      <Collapse in={!collapsed}>{taskList}</Collapse>
    </Box>
  );
};
