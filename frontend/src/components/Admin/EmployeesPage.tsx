import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Switch,
  Stack
} from '@mui/material';
import axios from 'axios';

interface Employee {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'teamlead' | 'employee';
  isActive: boolean;
}

const EmployeesPage: React.FC = () => {
  const [rows, setRows] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [q, setQ] = useState('');

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('/api/admin/employees');
      setRows(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const updateRole = async (id: string, role: Employee['role']) => {
    try {
      setSaving(id);
      await axios.put(`/api/admin/employees/${id}/role`, { role });
      setRows((prev) => prev.map((e) => (e._id === id ? { ...e, role } : e)));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update role');
    } finally {
      setSaving(null);
    }
  };

  const updateActive = async (id: string, isActive: boolean) => {
    try {
      setSaving(id);
      await axios.put(`/api/admin/employees/${id}/status`, { isActive });
      setRows((prev) => prev.map((e) => (e._id === id ? { ...e, isActive } : e)));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setSaving(null);
    }
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) =>
      r.name.toLowerCase().includes(term) ||
      r.email.toLowerCase().includes(term) ||
      r.role.toLowerCase().includes(term)
    );
  }, [rows, q]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Employees
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <TextField size="small" placeholder="Search employees..." value={q} onChange={(e) => setQ(e.target.value)} sx={{ width: 320 }} />
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row._id}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell width={220}>
                  <FormControl fullWidth size="small">
                    <InputLabel id={`role-${row._id}`}>Role</InputLabel>
                    <Select
                      labelId={`role-${row._id}`}
                      label="Role"
                      value={row.role}
                      onChange={(e) => updateRole(row._id, e.target.value as Employee['role'])}
                      disabled={saving === row._id}
                    >
                      <MenuItem value="employee">Employee</MenuItem>
                      <MenuItem value="teamlead">Team Lead</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell width={220}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={row.isActive ? 'Active' : 'Inactive'} color={row.isActive ? 'success' : 'default'} size="small" />
                    <Switch
                      checked={row.isActive}
                      onChange={(e) => updateActive(row._id, e.target.checked)}
                      disabled={saving === row._id}
                    />
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default EmployeesPage;


