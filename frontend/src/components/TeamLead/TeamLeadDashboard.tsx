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
  Alert
} from '@mui/material';
import {
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Business as BusinessIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import axios from 'axios';

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
}

interface TeamPerformance {
  employee: {
    id: string;
    name: string;
    email: string;
  };
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  totalTimeSpent: number;
}

const TeamLeadDashboard: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null);
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [teamResponse, statsResponse, performanceResponse] = await Promise.all([
        axios.get('/api/teamlead/team'),
        axios.get('/api/teamlead/tasks/stats'),
        axios.get('/api/teamlead/team/performance')
      ]);

      // Validate and set team members - ensure it's an array
      const teamData = teamResponse.data;
      setTeamMembers(Array.isArray(teamData) ? teamData : []);

      // Set task stats
      setTaskStats(statsResponse.data);

      // Validate and set team performance - ensure it's an array
      const performanceData = performanceResponse.data;
      setTeamPerformance(Array.isArray(performanceData) ? performanceData : []);
      
      setError('');
    } catch (err: any) {
      console.error('Dashboard data fetch error:', err);
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
      // Set empty arrays on error to prevent map errors
      setTeamMembers([]);
      setTeamPerformance([]);
    } finally {
      setLoading(false);
    }
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
        Team Lead Dashboard
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
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
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AssignmentIcon color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    In Progress
                  </Typography>
                  <Typography variant="h4">
                    {taskStats?.inProgress || 0}
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

        {/* Team Members */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Team Members ({teamMembers.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => window.location.href = '/teamlead/tasks'}
              >
                Create Task
              </Button>
            </Box>
            {teamMembers.length > 0 ? (
              <List>
                {teamMembers.map((member) => (
                  <ListItem key={member._id}>
                    <ListItemText
                      primary={member.name}
                      secondary={member.email}
                    />
                    <Chip 
                      label={member.isActive ? 'Active' : 'Inactive'} 
                      color={member.isActive ? 'success' : 'error'} 
                      size="small" 
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="textSecondary" align="center" sx={{ py: 2 }}>
                No team members found
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Team Performance */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Team Performance
            </Typography>
            {teamPerformance.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell align="right">Tasks</TableCell>
                      <TableCell align="right">Completed</TableCell>
                      <TableCell align="right">Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {teamPerformance.map((perf) => (
                      <TableRow key={perf.employee.id}>
                        <TableCell>{perf.employee.name}</TableCell>
                        <TableCell align="right">{perf.totalTasks}</TableCell>
                        <TableCell align="right">{perf.completedTasks}</TableCell>
                        <TableCell align="right">
                          {perf.completionRate.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="textSecondary" align="center" sx={{ py: 2 }}>
                No performance data available
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<AssignmentIcon />}
                onClick={() => window.location.href = '/teamlead/tasks'}
              >
                Manage Tasks
              </Button>
              <Button
                variant="outlined"
                startIcon={<PeopleIcon />}
                onClick={() => window.location.href = '/teamlead/team'}
              >
                View Team
              </Button>
              <Button
                variant="outlined"
                startIcon={<BusinessIcon />}
                onClick={() => window.location.href = '/teamlead/projects'}
              >
                View Projects
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TeamLeadDashboard;