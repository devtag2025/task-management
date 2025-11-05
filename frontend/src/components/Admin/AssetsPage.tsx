import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
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
  TextField as MuiTextField
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, AssignmentInd as AssignmentIndIcon, Replay as ReplayIcon } from '@mui/icons-material';
import axios from 'axios';
import { api } from '../../lib/api';

type AssetType = 'laptop' | 'mouse' | 'keyboard' | 'headphone' | 'charger' | 'bag';
type AssetStatus = 'available' | 'occupied' | 'maintenance' | 'retired';

interface AssetRow {
  _id: string;
  assetName: string;
  assetType: AssetType;
  status: AssetStatus;
  brand?: string;
  model?: string;
  serialNumber?: string;
  specifications?: { processor?: string; ram?: string; rom?: string; other?: string };
  assignedTo?: { _id: string; name: string; email: string } | null;
  expectedReturnDate?: string;
}

const AssetsPage: React.FC = () => {
  const [rows, setRows] = useState<AssetRow[]>([]);
  const [employees, setEmployees] = useState<{ _id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  // Create/Edit dialog state
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    assetName: '',
    assetType: 'laptop' as AssetType,
    status: 'available' as AssetStatus,
    brand: '',
    model: '',
    serialNumber: '',
    processor: '',
    ram: '',
    rom: '',
    other: ''
  });

  // Assign dialog
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignId, setAssignId] = useState<string | null>(null);
  const [assignForm, setAssignForm] = useState({ employeeId: '', expectedReturnDate: '' });

  const resetForm = () => {
    setForm({
      assetName: '',
      assetType: 'laptop',
      status: 'available',
      brand: '',
      model: '',
      serialNumber: '',
      processor: '',
      ram: '',
      rom: '',
      other: ''
    });
    setEditId(null);
  };

  const fetchAssets = async () => {
    try {
      const res = await api.get('/api/admin/assets');
      setRows(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
    (async () => {
      try {
        const res = await api.get('/api/admin/employees');
        setEmployees((res.data || []).map((e: any) => ({ _id: e._id, name: e.name })));
      } catch (e) { /* ignore */ }
    })();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((a) => (
      a.assetName.toLowerCase().includes(term) ||
      a.assetType.toLowerCase().includes(term) ||
      (a.brand || '').toLowerCase().includes(term) ||
      (a.model || '').toLowerCase().includes(term) ||
      (a.serialNumber || '').toLowerCase().includes(term) ||
      (a.assignedTo?.name || '').toLowerCase().includes(term)
    ));
  }, [rows, q]);

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (asset: any) => {
    setEditId(asset._id);
    setForm({
      assetName: asset.assetName || '',
      assetType: asset.assetType || 'laptop',
      status: asset.status || 'available',
      brand: asset.brand || '',
      model: asset.model || '',
      serialNumber: asset.serialNumber || '',
      processor: asset.specifications?.processor || '',
      ram: asset.specifications?.ram || '',
      rom: asset.specifications?.rom || '',
      other: asset.specifications?.other || ''
    });
    setOpen(true);
  };

  const saveAsset = async () => {
    try {
      setSaving(true);
      setError('');
      const payload: any = {
        assetName: form.assetName,
        assetType: form.assetType,
        status: form.status,
        brand: form.brand || undefined,
        model: form.model || undefined,
        serialNumber: form.serialNumber || undefined,
        specifications: {
          processor: form.processor || undefined,
          ram: form.ram || undefined,
          rom: form.rom || undefined,
          other: form.other || undefined
        }
      };
      if (editId) {
        await api.put(`/api/admin/assets/${editId}`, payload);
      } else {
        await api.post('/api/admin/assets', payload);
      }
      setOpen(false);
      resetForm();
      fetchAssets();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save asset');
    } finally {
      setSaving(false);
    }
  };

  const openAssign = (id: string) => {
    setAssignId(id);
    setAssignForm({ employeeId: '', expectedReturnDate: '' });
    setAssignOpen(true);
  };

  const assignAsset = async () => {
    if (!assignId) return;
    try {
      setSaving(true);
      await api.put(`/api/admin/assets/${assignId}/assign`, {
        employeeId: assignForm.employeeId,
        expectedReturnDate: assignForm.expectedReturnDate || undefined
      });
      setAssignOpen(false);
      setAssignId(null);
      fetchAssets();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign asset');
    } finally {
      setSaving(false);
    }
  };

  const returnAsset = async (id: string) => {
    try {
      setSaving(true);
      await api.put(`/api/admin/assets/${id}/return`);
      fetchAssets();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to return asset');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Assets</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          New Asset
        </Button>
      </Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <MuiTextField size="small" placeholder="Search assets..." value={q} onChange={(e) => setQ(e.target.value)} sx={{ width: 360 }} />
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
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Brand/Model</TableCell>
              <TableCell>Serial</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((a: any) => (
              <TableRow key={a._id}>
                <TableCell>{a.assetName}</TableCell>
                <TableCell>{a.assetType}</TableCell>
                <TableCell><Chip label={a.status} size="small" color={a.status === 'available' ? 'success' : a.status === 'occupied' ? 'warning' : 'default'} /></TableCell>
                <TableCell>{[a.brand, a.model].filter(Boolean).join(' / ')}</TableCell>
                <TableCell>{a.serialNumber || '-'}</TableCell>
                <TableCell>{a.assignedTo?.name || '-'}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openEdit(a)}><EditIcon /></IconButton>
                  {a.status === 'available' ? (
                    <IconButton size="small" onClick={() => openAssign(a._id)}><AssignmentIndIcon /></IconButton>
                  ) : (
                    <IconButton size="small" onClick={() => returnAsset(a._id)} title="Mark Returned"><ReplayIcon /></IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editId ? 'Edit Asset' : 'Create Asset'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <TextField label="Asset Name" fullWidth required value={form.assetName} onChange={(e) => setForm({ ...form, assetName: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel id="asset-type">Type</InputLabel>
                <Select labelId="asset-type" label="Type" value={form.assetType} onChange={(e) => setForm({ ...form, assetType: e.target.value as AssetType })}>
                  <MenuItem value="laptop">Laptop</MenuItem>
                  <MenuItem value="mouse">Mouse</MenuItem>
                  <MenuItem value="keyboard">Keyboard</MenuItem>
                  <MenuItem value="headphone">Headphone</MenuItem>
                  <MenuItem value="charger">Charger</MenuItem>
                  <MenuItem value="bag">Bag</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel id="asset-status">Status</InputLabel>
                <Select labelId="asset-status" label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AssetStatus })}>
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="occupied">Occupied</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="retired">Retired</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Brand" fullWidth value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Model" fullWidth value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Serial Number" fullWidth value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} />
            </Grid>
            {form.assetType === 'laptop' && (
              <>
                <Grid item xs={12} md={4}>
                  <TextField label="Processor" fullWidth value={form.processor} onChange={(e) => setForm({ ...form, processor: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField label="RAM" fullWidth value={form.ram} onChange={(e) => setForm({ ...form, ram: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField label="ROM/Storage" fullWidth value={form.rom} onChange={(e) => setForm({ ...form, rom: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Other Specs" fullWidth value={form.other} onChange={(e) => setForm({ ...form, other: e.target.value })} />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={saveAsset} disabled={saving || !form.assetName}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Asset</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="assign-emp">Employee</InputLabel>
                <Select labelId="assign-emp" label="Employee" value={assignForm.employeeId} onChange={(e) => setAssignForm({ ...assignForm, employeeId: e.target.value as string })}>
                  {employees.map((e) => (
                    <MenuItem key={e._id} value={e._id}>{e.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Expected Return Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={assignForm.expectedReturnDate} onChange={(e) => setAssignForm({ ...assignForm, expectedReturnDate: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={assignAsset} disabled={saving || !assignForm.employeeId}>Assign</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssetsPage;


