import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import dayjs from 'dayjs';

interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'on-hold' | 'cancelled';
  priority: string;
  project: {
    projectName: string;
    status: string;
    deadline: string;
  };
  dueDate: string;
  createdBy: {
    name: string;
    email: string;
  };
  statusHistory?: Array<{
    from: string;
    to: string;
    comment: string;
    updatedAt: string;
  }>;
}

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/employee/tasks');
      setTasks(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStatusUpdate = async () => {
    if (!selectedTask || !newStatus) return;

    try {
      await axios.patch(`/api/employee/tasks/${selectedTask._id}/status`, {
        status: newStatus,
        comment: statusComment
      });

      setSuccess('Task status updated successfully');
      fetchTasks();
      setStatusDialogOpen(false);
      setSelectedTask(null);
      setNewStatus('');
      setStatusComment('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update task status');
    }
  };

  const openStatusDialog = (task: Task) => {
    setSelectedTask(task);
    setNewStatus(task.status);
    setStatusDialogOpen(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'in-progress':
        return 'info';
      case 'on-hold':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" m={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        My Tasks
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {tasks.map((task) => (
          <Grid item xs={12} key={task._id}>
            <Card>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="h6">{task.title}</Typography>
                    <Typography color="textSecondary" gutterBottom>
                      Project: {task.project.projectName}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {task.description}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" justifyContent="flex-end" gap={1} flexWrap="wrap">
                      <Chip
                        label={task.priority}
                        color={getPriorityColor(task.priority) as any}
                        size="small"
                      />
                      <Chip
                        label={task.status}
                        color={getStatusColor(task.status) as any}
                        size="small"
                      />
                      <Chip
                        icon={<ScheduleIcon />}
                        label={format(new Date(task.dueDate), 'MMM d, yyyy')}
                        size="small"
                      />
                    </Box>
                    <Box display="flex" justifyContent="flex-end" mt={2}>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AssignmentIcon />}
                        onClick={() => openStatusDialog(task)}
                      >
                        Update Status
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Update Task Status</DialogTitle>
        <DialogContent>
          <Box my={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={newStatus}
                label="Status"
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in-progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="on-hold">On Hold</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Status Update Comment"
            value={statusComment}
            onChange={(e) => setStatusComment(e.target.value)}
            placeholder="Add a comment about this status change..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleStatusUpdate}
            variant="contained"
            color="primary"
            disabled={!newStatus || !statusComment}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Tasks;