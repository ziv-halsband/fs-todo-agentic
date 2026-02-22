import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Alert,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { type Dayjs } from 'dayjs';

import { useTodoStore } from '../../store/todoStore';
import type { Priority, Task } from '../../services/todoService';

interface Props {
  open: boolean;
  task?: Task;
  defaultListId?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export const TaskFormModal = ({
  open,
  task,
  defaultListId,
  onClose,
  onSaved,
}: Props) => {
  const { lists, addTodo, editTodo } = useTodoStore();
  const isEdit = Boolean(task);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [listId, setListId] = useState('');
  const [dueDate, setDueDate] = useState<Dayjs | null>(null);
  const [titleError, setTitleError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSaveError(null);
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setPriority(task.priority);
      setListId(task.listId);
      setDueDate(task.dueDate ? dayjs(task.dueDate) : null);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setListId(defaultListId ?? lists[0]?.id ?? '');
      setDueDate(null);
    }
    setTitleError(false);
  }, [open, task, defaultListId, lists]);

  const handleSave = async () => {
    if (!title.trim()) {
      setTitleError(true);
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        listId,
        dueDate: dueDate ? dueDate.toISOString() : undefined,
      };

      if (isEdit && task) {
        await editTodo(task.id, payload);
      } else {
        await addTodo(payload);
      }

      onSaved();
    } catch {
      setSaveError('Failed to save task. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        {isEdit ? 'Edit Task' : 'New Task'}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {saveError && <Alert severity="error">{saveError}</Alert>}

          <TextField
            label="Title"
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (e.target.value.trim()) setTitleError(false);
            }}
            error={titleError}
            helperText={titleError ? 'Title is required' : ''}
            size="small"
            fullWidth
            autoFocus
            required
          />

          <TextField
            label="Description"
            placeholder="Add more details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            size="small"
            fullWidth
            multiline
            rows={3}
          />

          <Stack direction="row" spacing={2}>
            <TextField
              select
              label="Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              size="small"
              sx={{ flex: 1 }}
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="List"
              value={listId}
              onChange={(e) => setListId(e.target.value)}
              size="small"
              sx={{ flex: 1 }}
              disabled={lists.length === 0}
            >
              {lists.map((list) => (
                <MenuItem key={list.id} value={list.id}>
                  {list.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Due Date (optional)"
              value={dueDate}
              onChange={(newValue) => setDueDate(newValue)}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </LocalizationProvider>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} color="inherit" disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disableElevation
          disabled={saving}
        >
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Task'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
