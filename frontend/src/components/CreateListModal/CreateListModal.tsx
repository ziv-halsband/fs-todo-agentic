import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import WorkIcon from '@mui/icons-material/Work';
import PersonIcon from '@mui/icons-material/Person';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import HomeIcon from '@mui/icons-material/Home';
import StarIcon from '@mui/icons-material/Star';
import SchoolIcon from '@mui/icons-material/School';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';

import { useTodoStore } from '../../store/todoStore';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const ICON_OPTIONS: { key: string; label: string; node: React.ReactNode }[] = [
  {
    key: 'list',
    label: 'List',
    node: <FormatListBulletedIcon fontSize="small" />,
  },
  { key: 'work', label: 'Work', node: <WorkIcon fontSize="small" /> },
  { key: 'person', label: 'Personal', node: <PersonIcon fontSize="small" /> },
  {
    key: 'shopping_cart',
    label: 'Shopping',
    node: <ShoppingCartIcon fontSize="small" />,
  },
  { key: 'home', label: 'Home', node: <HomeIcon fontSize="small" /> },
  { key: 'star', label: 'Starred', node: <StarIcon fontSize="small" /> },
  { key: 'school', label: 'School', node: <SchoolIcon fontSize="small" /> },
  {
    key: 'fitness',
    label: 'Fitness',
    node: <FitnessCenterIcon fontSize="small" />,
  },
];

const COLOR_OPTIONS = [
  { hex: '#6C5CE7', label: 'Purple' },
  { hex: '#0984E3', label: 'Blue' },
  { hex: '#00B894', label: 'Green' },
  { hex: '#FDCB6E', label: 'Yellow' },
  { hex: '#E17055', label: 'Orange' },
  { hex: '#E84393', label: 'Pink' },
];

export const CreateListModal = ({ open, onClose, onSaved }: Props) => {
  const { createList } = useTodoStore();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('list');
  const [color, setColor] = useState(COLOR_OPTIONS[0].hex);
  const [nameError, setNameError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName('');
    setIcon('list');
    setColor(COLOR_OPTIONS[0].hex);
    setNameError(false);
    setSaveError(null);
  }, [open]);

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await createList({ name: name.trim(), icon, color });
      onSaved();
    } catch {
      setSaveError('Failed to create list. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>New List</DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {saveError && <Alert severity="error">{saveError}</Alert>}

          <TextField
            label="List name"
            placeholder="e.g. Groceries, Work, Ideas…"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (e.target.value.trim()) setNameError(false);
            }}
            error={nameError}
            helperText={nameError ? 'Name is required' : ''}
            size="small"
            fullWidth
            autoFocus
            required
          />

          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 1, display: 'block' }}
            >
              ICON
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {ICON_OPTIONS.map((opt) => (
                <Tooltip key={opt.key} title={opt.label} placement="top">
                  <Box
                    onClick={() => setIcon(opt.key)}
                    sx={{
                      width: 36,
                      height: 36,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 1.5,
                      cursor: 'pointer',
                      border: '2px solid',
                      borderColor: icon === opt.key ? color : 'transparent',
                      bgcolor: icon === opt.key ? `${color}18` : 'action.hover',
                      color: icon === opt.key ? color : 'text.secondary',
                      transition: 'all 0.15s',
                      '&:hover': {
                        bgcolor: `${color}18`,
                        color: color,
                      },
                    }}
                  >
                    {opt.node}
                  </Box>
                </Tooltip>
              ))}
            </Box>
          </Box>

          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 1, display: 'block' }}
            >
              COLOR
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {COLOR_OPTIONS.map((opt) => (
                <Tooltip key={opt.hex} title={opt.label} placement="top">
                  <Box
                    onClick={() => setColor(opt.hex)}
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: opt.hex,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      outline:
                        color === opt.hex ? `3px solid ${opt.hex}` : 'none',
                      outlineOffset: '2px',
                      transition: 'outline 0.15s',
                    }}
                  >
                    {color === opt.hex && (
                      <CheckIcon sx={{ fontSize: 14, color: '#fff' }} />
                    )}
                  </Box>
                </Tooltip>
              ))}
            </Box>
          </Box>
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
          {saving ? 'Creating…' : 'Create List'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
