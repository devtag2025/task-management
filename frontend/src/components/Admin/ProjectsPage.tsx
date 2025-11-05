import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField as MuiTextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Chip,
  IconButton,
  Alert,
  Checkbox,
  FormGroup,
  FormControlLabel
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import axios from 'axios';
import { api } from '../../lib/api';

type Priority = 'low' | 'medium' | 'high' | 'urgent';
type Category = 'fixed' | 'hourly' | 'milestone';

interface MilestoneForm {
  title: string;
  description: string;
  amount: string;
  dueDate: string;
}

interface ProjectRow {
  _id: string;
  projectName: string;
  status: string;
  category: Category;
  priority: Priority;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  totalPrice: number;
  teamLead?: { _id: string; name: string } | string;
}

const HIDEABLE_FIELDS = [
  'description',
  'deadline',
  'clientName',
  'clientEmail',
  'clientPhone',
  'totalPrice',
  'projectPlatform',
  'projectProfile',
  'status',
  'category',
  'priority',
  'milestones'
] as const;

const ProjectsPage: React.FC = () => {
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    projectName: '',
    description: '',
    deadline: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    totalPrice: '',
    projectPlatform: '',
    projectProfile: '',
    status: 'planning',
    category: 'fixed' as Category,
    priority: 'medium' as Priority,
    teamLead: ''
  });
  const [milestones, setMilestones] = useState<MilestoneForm[]>([]);
  const [hiddenFields, setHiddenFields] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [teamLeads, setTeamLeads] = useState<{ _id: string; name: string }[]>([]);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editHiddenFields, setEditHiddenFields] = useState<string[]>([]);

  const resetForm = () => {
    setForm({
      projectName: '',
      description: '',
      deadline: '',
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      totalPrice: '',
      projectPlatform: '',
      projectProfile: '',
      status: 'planning',
      category: 'fixed',
      priority: 'medium',
      teamLead: ''
    });
    setMilestones([]);
    setHiddenFields([]);
  };

  const fetchProjects = async () => {
    try {
      const res = await api.get('/api/admin/projects');
      setRows(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    // Load team leads for selection
    (async () => {
      try {
        const res = await api.get('/api/admin/employees');
        const tls = (res.data || []).filter((u: any) => u.role === 'teamlead').map((u: any) => ({ _id: u._id, name: u.name }));
        setTeamLeads(tls);
      } catch (e) {
        // ignore silently
      }
    })();
  }, []);

  const addMilestone = () => {
    setMilestones((prev) => ([...prev, { title: '', description: '', amount: '', dueDate: '' }]));
  };
  const removeMilestone = (idx: number) => {
    setMilestones((prev) => prev.filter((_, i) => i !== idx));
  };

  const canSubmit = useMemo(() => {
    return !!form.projectName && !!form.description && !!form.deadline && !!form.clientName && !!form.clientEmail && !!form.clientPhone && !!form.totalPrice && !!form.projectPlatform && !!form.projectProfile;
  }, [form]);

  const handleCreate = async () => {
    try {
      setSaving(true);
      setError('');
      // Prepare payload
      const payload: any = {
        ...form,
        totalPrice: Number(form.totalPrice),
        deadline: new Date(form.deadline).toISOString(),
      };
      if (form.category === 'milestone' && milestones.length > 0) {
        payload.milestones = milestones.map((m) => ({
          title: m.title,
          description: m.description,
          amount: Number(m.amount || 0),
          dueDate: new Date(m.dueDate).toISOString(),
        }));
      }

      const createRes = await api.post('/api/admin/projects', payload);
      const created = createRes.data.project;

      if (hiddenFields.length > 0) {
        await api.put(`/api/admin/projects/${created._id}/hidden-fields`, { hiddenFieldsForTeamLead: hiddenFields });
      }

      setOpen(false);
      resetForm();
      fetchProjects();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (project: any) => {
    setEditId(project._id);
    setForm({
      projectName: project.projectName || '',
      description: project.description || '',
      deadline: project.deadline ? String(project.deadline).slice(0, 10) : '',
      clientName: project.clientName || '',
      clientEmail: project.clientEmail || '',
      clientPhone: project.clientPhone || '',
      totalPrice: String(project.totalPrice || ''),
      projectPlatform: project.projectPlatform || '',
      projectProfile: project.projectProfile || '',
      status: project.status || 'planning',
      category: project.category || 'fixed',
      priority: project.priority || 'medium',
      teamLead: typeof project.teamLead === 'object' ? (project.teamLead?._id || '') : (project.teamLead || '')
    });
    setMilestones(Array.isArray(project.milestones) ? project.milestones.map((m: any) => ({
      title: m.title || '',
      description: m.description || '',
      amount: String(m.amount || ''),
      dueDate: m.dueDate ? String(m.dueDate).slice(0, 10) : ''
    })) : []);
    setEditHiddenFields(project.hiddenFieldsForTeamLead || []);
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editId) return;
    try {
      setSaving(true);
      setError('');
      const payload: any = {
        ...form,
        totalPrice: Number(form.totalPrice),
        deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
      };
      if (form.category === 'milestone') {
        payload.milestones = milestones.map((m) => ({
          title: m.title,
          description: m.description,
          amount: Number(m.amount || 0),
          dueDate: m.dueDate ? new Date(m.dueDate).toISOString() : undefined,
        }));
      }
      await api.put(`/api/admin/projects/${editId}`, payload);
      await api.put(`/api/admin/projects/${editId}/hidden-fields`, { hiddenFieldsForTeamLead: editHiddenFields });
      setEditOpen(false);
      setEditId(null);
      resetForm();
      fetchProjects();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows as any[];
    return (rows as any[]).filter((p) =>
      (p.projectName || '').toLowerCase().includes(term) ||
      (p.clientName || '').toLowerCase().includes(term) ||
      (p.status || '').toLowerCase().includes(term) ||
      (p.category || '').toLowerCase().includes(term) ||
      (p.priority || '').toLowerCase().includes(term)
    );
  }, [rows, q]);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Projects</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          New Project
        </Button>
      </Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <MuiTextField size="small" placeholder="Search projects..." value={q} onChange={(e) => setQ(e.target.value)} sx={{ width: 360 }} />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

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
              <TableCell>Team Lead</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((p: any) => (
              <TableRow key={p._id}>
                <TableCell>{p.projectName}</TableCell>
                <TableCell><Chip label={p.status} size="small" /></TableCell>
                <TableCell>{p.category}</TableCell>
                <TableCell>{p.priority}</TableCell>
                <TableCell>{p.clientName}</TableCell>
                <TableCell>{p.totalPrice}</TableCell>
                <TableCell>{typeof p.teamLead === 'object' ? p.teamLead?.name : '-'}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openEdit(p)}>
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Project</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <TextField label="Project Name" fullWidth required value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Deadline" type="date" fullWidth required InputLabelProps={{ shrink: true }} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Description" fullWidth required multiline minRows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Client Name" fullWidth required value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Client Email" type="email" fullWidth required value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Client Phone" fullWidth required value={form.clientPhone} onChange={(e) => setForm({ ...form, clientPhone: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Total Price" type="number" fullWidth required value={form.totalPrice} onChange={(e) => setForm({ ...form, totalPrice: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Project Platform" fullWidth required value={form.projectPlatform} onChange={(e) => setForm({ ...form, projectPlatform: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Project Profile" fullWidth required value={form.projectProfile} onChange={(e) => setForm({ ...form, projectProfile: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="category-label">Category</InputLabel>
                <Select labelId="category-label" label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })}>
                  <MenuItem value="fixed">Fixed</MenuItem>
                  <MenuItem value="hourly">Hourly</MenuItem>
                  <MenuItem value="milestone">Milestone</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="teamlead-label">Team Lead</InputLabel>
                <Select labelId="teamlead-label" label="Team Lead" value={form.teamLead} onChange={(e) => setForm({ ...form, teamLead: e.target.value as string })}>
                  <MenuItem value="">None</MenuItem>
                  {teamLeads.map((tl) => (
                    <MenuItem key={tl._id} value={tl._id}>{tl.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="priority-label">Priority</InputLabel>
                <Select labelId="priority-label" label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="status-label">Status</InputLabel>
                <Select labelId="status-label" label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <MenuItem value="planning">Planning</MenuItem>
                  <MenuItem value="in-progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="on-hold">On Hold</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {form.category === 'milestone' && (
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="subtitle1">Milestones</Typography>
                  <Button size="small" startIcon={<AddIcon />} onClick={addMilestone}>Add Milestone</Button>
                </Box>
                {milestones.map((m, idx) => (
                  <Grid container spacing={1} key={idx} sx={{ mb: 1 }}>
                    <Grid item xs={12} md={3}>
                      <TextField label="Title" fullWidth value={m.title} onChange={(e) => setMilestones((prev) => prev.map((x, i) => i === idx ? { ...x, title: e.target.value } : x))} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField label="Description" fullWidth value={m.description} onChange={(e) => setMilestones((prev) => prev.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))} />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField label="Amount" type="number" fullWidth value={m.amount} onChange={(e) => setMilestones((prev) => prev.map((x, i) => i === idx ? { ...x, amount: e.target.value } : x))} />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField label="Due Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={m.dueDate} onChange={(e) => setMilestones((prev) => prev.map((x, i) => i === idx ? { ...x, dueDate: e.target.value } : x))} />
                    </Grid>
                    <Grid item xs={12} md={1}>
                      <IconButton color="error" onClick={() => removeMilestone(idx)}><DeleteIcon /></IconButton>
                    </Grid>
                  </Grid>
                ))}
              </Grid>
            )}

            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 1 }}>Hide these fields from Team Lead</Typography>
              <FormGroup row>
                {HIDEABLE_FIELDS.map((field) => (
                  <FormControlLabel
                    key={field}
                    label={field}
                    control={
                      <Checkbox
                        checked={hiddenFields.includes(field)}
                        onChange={(e) => {
                          setHiddenFields((prev) => e.target.checked ? [...prev, field] : prev.filter((f) => f !== field));
                        }}
                      />
                    }
                  />
                ))}
              </FormGroup>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpen(false); resetForm(); }} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!canSubmit || saving}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Project</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <TextField label="Project Name" fullWidth required value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Deadline" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Description" fullWidth required multiline minRows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Client Name" fullWidth required value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Client Email" type="email" fullWidth required value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Client Phone" fullWidth required value={form.clientPhone} onChange={(e) => setForm({ ...form, clientPhone: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Total Price" type="number" fullWidth required value={form.totalPrice} onChange={(e) => setForm({ ...form, totalPrice: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Project Platform" fullWidth required value={form.projectPlatform} onChange={(e) => setForm({ ...form, projectPlatform: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Project Profile" fullWidth required value={form.projectProfile} onChange={(e) => setForm({ ...form, projectProfile: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="edit-category-label">Category</InputLabel>
                <Select labelId="edit-category-label" label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })}>
                  <MenuItem value="fixed">Fixed</MenuItem>
                  <MenuItem value="hourly">Hourly</MenuItem>
                  <MenuItem value="milestone">Milestone</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="edit-priority-label">Priority</InputLabel>
                <Select labelId="edit-priority-label" label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="edit-teamlead-label">Team Lead</InputLabel>
                <Select labelId="edit-teamlead-label" label="Team Lead" value={form.teamLead} onChange={(e) => setForm({ ...form, teamLead: e.target.value as string })}>
                  <MenuItem value="">None</MenuItem>
                  {teamLeads.map((tl) => (
                    <MenuItem key={tl._id} value={tl._id}>{tl.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {form.category === 'milestone' && (
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="subtitle1">Milestones</Typography>
                  <Button size="small" startIcon={<AddIcon />} onClick={addMilestone}>Add Milestone</Button>
                </Box>
                {milestones.map((m, idx) => (
                  <Grid container spacing={1} key={idx} sx={{ mb: 1 }}>
                    <Grid item xs={12} md={3}>
                      <TextField label="Title" fullWidth value={m.title} onChange={(e) => setMilestones((prev) => prev.map((x, i) => i === idx ? { ...x, title: e.target.value } : x))} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField label="Description" fullWidth value={m.description} onChange={(e) => setMilestones((prev) => prev.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))} />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField label="Amount" type="number" fullWidth value={m.amount} onChange={(e) => setMilestones((prev) => prev.map((x, i) => i === idx ? { ...x, amount: e.target.value } : x))} />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField label="Due Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={m.dueDate} onChange={(e) => setMilestones((prev) => prev.map((x, i) => i === idx ? { ...x, dueDate: e.target.value } : x))} />
                    </Grid>
                    <Grid item xs={12} md={1}>
                      <IconButton color="error" onClick={() => removeMilestone(idx)}><DeleteIcon /></IconButton>
                    </Grid>
                  </Grid>
                ))}
              </Grid>
            )}

            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 1 }}>Hide these fields from Team Lead</Typography>
              <FormGroup row>
                {HIDEABLE_FIELDS.map((field) => (
                  <FormControlLabel
                    key={field}
                    label={field}
                    control={
                      <Checkbox
                        checked={editHiddenFields.includes(field)}
                        onChange={(e) => {
                          setEditHiddenFields((prev) => e.target.checked ? [...prev, field] : prev.filter((f) => f !== field));
                        }}
                      />
                    }
                  />
                ))}
              </FormGroup>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setEditOpen(false); setEditId(null); }} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdate} disabled={saving}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectsPage;


