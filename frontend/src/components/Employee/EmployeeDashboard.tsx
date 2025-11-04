import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Inventory as InventoryIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Task as TaskIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  dueDate: string;
  priority: string;
  project: {
    projectName: string;
    status: string;
  };
  totalTimeSpent: number;
  timeEntries: Array<{
    startTime: string;
    endTime?: string;
    duration?: number;
    status: string;
  }>;
}

interface Asset {
  _id: string;
  assetName: string;
  assetType: string;
  status: string;
  assignedDate: string;
}

interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
  totalTimeSpent: number;
  completionRate: number;
}

const EmployeeDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [tasksResponse, assetsResponse, statsResponse] = await Promise.all([
        axios.get('/api/employee/tasks'),
        axios.get('/api/employee/assets'),
        axios.get('/api/employee/tasks/stats')
      ]);

      setTasks(tasksResponse.data.slice(0, 5)); // Show only recent 5 tasks
      setAssets(assetsResponse.data);
      setTaskStats(statsResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'warning';
      case 'pending': return 'info';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Employee Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Task Statistics */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AssignmentIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Tasks
                  </Typography>
                  <Typography variant="h4">
                    {taskStats?.total || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUpIcon color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Completed
                  </Typography>
                  <Typography variant="h4">
                    {taskStats?.completed || 0}
                  </Typography>
                  <Typography color="textSecondary" variant="body2">
                    {taskStats?.completionRate.toFixed(1)}% completion rate
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ScheduleIcon color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Time Spent
                  </Typography>
                  <Typography variant="h4">
                    {formatTime(taskStats?.totalTimeSpent || 0)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AssignmentIcon color="error" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Overdue
                  </Typography>
                  <Typography variant="h4">
                    {taskStats?.overdue || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Tasks */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Recent Tasks
              </Typography>
              <Button
                component={RouterLink}
                to="/employee/tasks"
                variant="contained"
                startIcon={<TaskIcon />}
              >
                View All Tasks
              </Button>
            </Box>
            <List>
              {tasks.map((task) => (
                <ListItem key={task._id}>
                  <ListItemText
                    primary={task.title}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Project: {task.project.projectName}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Time Spent: {formatTime(task.totalTimeSpent)}
                        </Typography>
                      </Box>
                    }
                  />
                  <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1}>
                    <Chip 
                      label={task.status} 
                      color={getStatusColor(task.status) as any} 
                      size="small" 
                    />
                    <Chip 
                      label={task.priority} 
                      color={getPriorityColor(task.priority) as any} 
                      size="small" 
                    />
                  </Box>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Assigned Assets */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Assigned Assets ({assets.length})
            </Typography>
            <List>
              {assets.map((asset) => (
                <ListItem key={asset._id}>
                  <ListItemText
                    primary={asset.assetName}
                    secondary={`Type: ${asset.assetType}`}
                  />
                  <Chip 
                    label={asset.status} 
                    color={asset.status === 'occupied' ? 'success' : 'default'} 
                    size="small" 
                  />
                </ListItem>
              ))}
            </List>
            <Button
              variant="outlined"
              fullWidth
              sx={{ mt: 2 }}
              onClick={() => window.location.href = '/employee/assets'}
            >
              View All Assets
            </Button>
          </Paper>
        </Grid>

        {/* Progress Overview */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Progress Overview
            </Typography>
            <Box mb={2}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Task Completion</Typography>
                <Typography variant="body2">
                  {taskStats?.completed || 0} / {taskStats?.total || 0}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={taskStats?.completionRate || 0} 
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<AssignmentIcon />}
                onClick={() => window.location.href = '/employee/tasks'}
              >
                My Tasks
              </Button>
              <Button
                variant="outlined"
                startIcon={<InventoryIcon />}
                onClick={() => window.location.href = '/employee/assets'}
              >
                My Assets
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmployeeDashboard;
