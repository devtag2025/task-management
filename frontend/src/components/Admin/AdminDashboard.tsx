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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  Inventory as InventoryIcon,
  Assignment as AssignmentIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  employees: {
    total: number;
    active: number;
    inactive: number;
  };
  projects: {
    total: number;
    active: number;
    completed: number;
  };
  assets: {
    total: number;
    available: number;
    occupied: number;
  };
  tasks: {
    total: number;
    completed: number;
    pending: number;
  };
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/admin/dashboard');
      setStats(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
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
        Admin Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Statistics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PeopleIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Employees
                  </Typography>
                  <Typography variant="h4">
                    {stats?.employees.total || 0}
                  </Typography>
                  <Typography color="textSecondary" variant="body2">
                    Active: {stats?.employees.active || 0} | Inactive: {stats?.employees.inactive || 0}
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
                <BusinessIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Projects
                  </Typography>
                  <Typography variant="h4">
                    {stats?.projects.total || 0}
                  </Typography>
                  <Typography color="textSecondary" variant="body2">
                    Active: {stats?.projects.active || 0} | Completed: {stats?.projects.completed || 0}
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
                <InventoryIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Assets
                  </Typography>
                  <Typography variant="h4">
                    {stats?.assets.total || 0}
                  </Typography>
                  <Typography color="textSecondary" variant="body2">
                    Available: {stats?.assets.available || 0} | Occupied: {stats?.assets.occupied || 0}
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
                <AssignmentIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Tasks
                  </Typography>
                  <Typography variant="h4">
                    {stats?.tasks.total || 0}
                  </Typography>
                  <Typography color="textSecondary" variant="body2">
                    Completed: {stats?.tasks.completed || 0} | Pending: {stats?.tasks.pending || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/admin/employees')}
              >
                Add Employee
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => window.location.href = '/admin/projects'}
              >
                Create Project
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => window.location.href = '/admin/assets'}
              >
                Add Asset
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              System Overview
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Employee Management"
                  secondary="Manage team members and their roles"
                />
                <Chip label="Active" color="success" size="small" />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Project Management"
                  secondary="Create and monitor projects"
                />
                <Chip label="Active" color="success" size="small" />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Asset Management"
                  secondary="Track company assets and assignments"
                />
                <Chip label="Active" color="success" size="small" />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
