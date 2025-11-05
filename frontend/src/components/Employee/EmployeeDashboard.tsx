//@ts-nocheck
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
  Alert,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Inventory as InventoryIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Task as TaskIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

const EmployeeDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [assets, setAssets] = useState([]);
  const [taskStats, setTaskStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated. Please login.');
      }
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      console.log('Fetching dashboard data...');

      // Fetch stats first (before tasks/:id route can catch it)
      console.log('Fetching stats from:', '/api/employee/tasks/stats');
      const statsRes = await fetch('/api/employee/tasks/stats', { headers });
      console.log('Stats response status:', statsRes.status);
      
      let statsData = {
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        overdue: 0,
        totalTimeSpent: 0,
        completionRate: 0
      };
      
      if (statsRes.ok) {
        const statsContentType = statsRes.headers.get('content-type');
        if (statsContentType && statsContentType.includes('application/json')) {
          statsData = await statsRes.json();
          console.log('Stats data:', statsData);
        }
      } else {
        console.error('Stats fetch failed:', statsRes.status, statsRes.statusText);
      }

      // Fetch tasks
      console.log('Fetching tasks from:', '/api/employee/tasks');
      const tasksRes = await fetch('/api/employee/tasks', { headers });
      console.log('Tasks response status:', tasksRes.status);
      
      if (!tasksRes.ok) {
        if (tasksRes.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        }
        if (tasksRes.status === 403) {
          throw new Error('Access denied. Employee role required.');
        }
        throw new Error(`Failed to fetch tasks: ${tasksRes.status} ${tasksRes.statusText}`);
      }
      
      const tasksContentType = tasksRes.headers.get('content-type');
      if (!tasksContentType || !tasksContentType.includes('application/json')) {
        throw new Error('Server returned invalid response. Check if backend is running on correct port.');
      }
      
      const tasksData = await tasksRes.json();
      console.log('Tasks data:', tasksData);

      // Fetch assets
      console.log('Fetching assets from:', '/api/employee/assets');
      const assetsRes = await fetch('/api/employee/assets', { headers });
      console.log('Assets response status:', assetsRes.status);
      
      let assetsData = [];
      if (assetsRes.ok) {
        const assetsContentType = assetsRes.headers.get('content-type');
        if (assetsContentType && assetsContentType.includes('application/json')) {
          assetsData = await assetsRes.json();
          console.log('Assets data:', assetsData);
        }
      }

      setTasks(Array.isArray(tasksData) ? tasksData.slice(0, 5) : []);
      setAssets(Array.isArray(assetsData.current) ? assetsData.current : Array.isArray(assetsData) ? assetsData : []);
      setTaskStats(statsData);
      setError('');
      
      console.log('Dashboard data loaded successfully');
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to fetch dashboard data. Check console for details.');
      setTasks([]);
      setAssets([]);
      setTaskStats({
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        overdue: 0,
        totalTimeSpent: 0,
        completionRate: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/employee/tasks/${taskId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to start task');
        return;
      }

      fetchDashboardData();
    } catch (err) {
      console.error('Error starting task:', err);
      setError('Failed to start task');
    }
  };

  const handleStopTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/employee/tasks/${taskId}/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          description: 'Work session completed'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to stop task');
        return;
      }

      fetchDashboardData();
    } catch (err) {
      console.error('Error stopping task:', err);
      setError('Failed to stop task');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'warning';
      case 'pending': return 'info';
      case 'on-hold': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const formatTime = (minutes) => {
    if (!minutes) return '0m';
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Employee Dashboard
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Task Statistics */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AssignmentIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
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
                <CheckCircleIcon color="success" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Completed
                  </Typography>
                  <Typography variant="h4">
                    {taskStats?.completed || 0}
                  </Typography>
                  <Typography color="textSecondary" variant="caption">
                    {taskStats?.completionRate?.toFixed(1) || 0}% completion rate
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
                <ScheduleIcon color="warning" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
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
                <ErrorIcon color="error" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
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
                variant="contained"
                startIcon={<TaskIcon />}
                onClick={() => window.location.href = '/employee/tasks'}
              >
                View All Tasks
              </Button>
            </Box>
            {tasks.length > 0 ? (
              <List>
                {tasks.map((task) => (
                  <ListItem 
                    key={task._id}
                    sx={{ 
                      border: 1, 
                      borderColor: 'divider', 
                      borderRadius: 1, 
                      mb: 1,
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {task.title}
                          </Typography>
                          <Chip 
                            label={task.priority} 
                            color={getPriorityColor(task.priority)} 
                            size="small" 
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                            {task.description}
                          </Typography>
                          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
                            <Typography variant="caption" color="textSecondary">
                              Project: {task.project?.projectName || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Time: {formatTime(task.totalTimeSpent)}
                            </Typography>
                            <Chip 
                              label={task.status} 
                              color={getStatusColor(task.status)} 
                              size="small" 
                            />
                            {task.status === 'in-progress' ? (
                              <Tooltip title="Stop task">
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => handleStopTask(task._id)}
                                >
                                  <StopIcon />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Tooltip title="Start task">
                                <IconButton 
                                  size="small" 
                                  color="success"
                                  onClick={() => handleStartTask(task._id)}
                                >
                                  <PlayIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
                No tasks assigned yet
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Assigned Assets */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Assigned Assets ({assets.length})
            </Typography>
            {assets.length > 0 ? (
              <List>
                {assets.map((asset) => (
                  <ListItem key={asset._id} sx={{ px: 0 }}>
                    <ListItemText
                      primary={asset.assetName}
                      secondary={`Type: ${asset.assetType}`}
                    />
                    <Chip 
                      label={asset.status === 'occupied' ? 'Active' : asset.status} 
                      color={asset.status === 'occupied' ? 'success' : 'default'} 
                      size="small" 
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="textSecondary" align="center" sx={{ py: 2 }}>
                No assets assigned
              </Typography>
            )}
            <Button
              variant="outlined"
              fullWidth
              sx={{ mt: 2 }}
              onClick={() => window.location.href = '/employee/assets'}
            >
              View All Assets
            </Button>
          </Paper>

          {/* Progress Overview */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Progress Overview
            </Typography>
            <Box mb={2}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Task Completion</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {taskStats?.completed || 0} / {taskStats?.total || 0}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={taskStats?.completionRate || 0} 
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="textSecondary" display="block" textAlign="right" mt={0.5}>
                {taskStats?.completionRate?.toFixed(1) || 0}%
              </Typography>
            </Box>

            <Grid container spacing={2} mb={2}>
              <Grid item xs={6}>
                <Box 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'warning.light', 
                    borderRadius: 1,
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="h5" color="warning.dark">
                    {taskStats?.inProgress || 0}
                  </Typography>
                  <Typography variant="caption" color="warning.dark">
                    In Progress
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'info.light', 
                    borderRadius: 1,
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="h5" color="info.dark">
                    {taskStats?.pending || 0}
                  </Typography>
                  <Typography variant="caption" color="info.dark">
                    Pending
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Box display="flex" flexDirection="column" gap={1}>
              <Button
                variant="outlined"
                startIcon={<AssignmentIcon />}
                fullWidth
                onClick={() => window.location.href = '/employee/tasks'}
              >
                My Tasks
              </Button>
              <Button
                variant="outlined"
                startIcon={<InventoryIcon />}
                fullWidth
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