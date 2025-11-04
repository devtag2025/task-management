import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Alert, Dialog, DialogTitle, DialogContent, Grid, Divider, Stack, FormControl, InputLabel, Select, MenuItem, Button, TextField } from '@mui/material';
import axios from 'axios';

interface ProjectRow {
  _id: string;
  projectName: string;
  status?: string;
  category?: string;
  priority?: string;
  clientName?: string;
  totalPrice?: number;
}

const ProjectsPage: React.FC = () => {
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState<any>(null);

  const fetchProjects = async () => {
    try {
      const res = await axios.get('/api/projects');
      setRows(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openDetails = async (id: string) => {
    try {
      const res = await axios.get(`/api/projects/${id}`);
      setDetails(res.data);
      setOpen(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load project');
    }
  };

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const filtered = rows.filter((p) => {
    const term = q.trim().toLowerCase();
    if (!term) return true;
    return (
      (p.projectName || '').toLowerCase().includes(term) ||
      (p.status || '').toLowerCase().includes(term) ||
      (p.category || '').toLowerCase().includes(term) ||
      (p.priority || '').toLowerCase().includes(term) ||
      (p.clientName || '').toLowerCase().includes(term)
    );
  });

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Projects
      </Typography>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <TextField size="small" placeholder="Search projects..." value={q} onChange={(e) => setQ(e.target.value)} sx={{ width: 360 }} />
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p._id} hover onClick={() => openDetails(p._id)} style={{ cursor: 'pointer' }}>
                <TableCell>{p.projectName}</TableCell>
                <TableCell>{p.status ? <Chip label={p.status} size="small" /> : '-'}</TableCell>
                <TableCell>{p.category || '-'}</TableCell>
                <TableCell>{p.priority || '-'}</TableCell>
                <TableCell>{p.clientName || '-'}</TableCell>
                <TableCell>{p.totalPrice ?? '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Project Details</DialogTitle>
        <DialogContent>
          {details && (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}><Typography variant="h6">{details.projectName}</Typography></Grid>
              {details.status && (
                <Grid item xs={12} md={4}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography>Status:</Typography>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <InputLabel id="tl-status">Status</InputLabel>
                      <Select labelId="tl-status" label="Status" value={details.status} onChange={async (e) => {
                        const status = e.target.value as string;
                        await axios.put(`/api/teamlead/projects/${details._id}`, { status });
                        setDetails({ ...details, status });
                        fetchProjects();
                      }}>
                        <MenuItem value="planning">Planning</MenuItem>
                        <MenuItem value="in-progress">In Progress</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                        <MenuItem value="on-hold">On Hold</MenuItem>
                        <MenuItem value="cancelled">Cancelled</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>
                </Grid>
              )}
              {details.category && (
                <Grid item xs={12} md={4}><Typography>Category: {details.category}</Typography></Grid>
              )}
              {details.priority && (
                <Grid item xs={12} md={4}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography>Priority:</Typography>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <InputLabel id="tl-priority">Priority</InputLabel>
                      <Select labelId="tl-priority" label="Priority" value={details.priority} onChange={async (e) => {
                        const priority = e.target.value as string;
                        await axios.put(`/api/teamlead/projects/${details._id}`, { priority });
                        setDetails({ ...details, priority });
                        fetchProjects();
                      }}>
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                        <MenuItem value="urgent">Urgent</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>
                </Grid>
              )}
              {details.description && (
                <Grid item xs={12}><Typography>Description: {details.description}</Typography></Grid>
              )}
              {details.deadline && (
                <Grid item xs={12} md={4}><Typography>Deadline: {new Date(details.deadline).toLocaleDateString()}</Typography></Grid>
              )}
              {details.clientName && (
                <Grid item xs={12} md={4}><Typography>Client: {details.clientName}</Typography></Grid>
              )}
              {details.clientEmail && (
                <Grid item xs={12} md={4}><Typography>Email: {details.clientEmail}</Typography></Grid>
              )}
              {details.clientPhone && (
                <Grid item xs={12} md={4}><Typography>Phone: {details.clientPhone}</Typography></Grid>
              )}
              {typeof details.totalPrice === 'number' && (
                <Grid item xs={12} md={4}><Typography>Total Price: {details.totalPrice}</Typography></Grid>
              )}
              {details.projectPlatform && (
                <Grid item xs={12} md={4}><Typography>Platform: {details.projectPlatform}</Typography></Grid>
              )}
              {details.projectProfile && (
                <Grid item xs={12}><Typography>Profile: {details.projectProfile}</Typography></Grid>
              )}
              {Array.isArray(details.milestones) && details.milestones.length > 0 && (
                <>
                  <Grid item xs={12}><Divider sx={{ my: 1 }} /><Typography variant="subtitle1">Milestones</Typography></Grid>
                  {details.milestones.map((m: any, idx: number) => (
                    <Grid item xs={12} key={idx}>
                      <Typography>- {m.title} | Amount: {m.amount} | Due: {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : '-'}</Typography>
                    </Grid>
                  ))}
                </>
              )}
            </Grid>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ProjectsPage;


