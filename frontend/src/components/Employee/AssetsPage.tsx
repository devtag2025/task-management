import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  TextField,
  CircularProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { api } from '../../lib/api';
import { format } from 'date-fns';

interface Asset {
  _id: string;
  assetName: string;
  assetType: string;
  status: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  assignedDate?: string;
  returnDate?: string;
  expectedReturnDate?: string;
  condition?: string;
  notes?: string;
  specifications?: {
    processor?: string;
    ram?: string;
    rom?: string;
    other?: string;
  };
}

interface AssetStats {
  totalAssigned: number;
  byType: Record<string, number>;
  overdueCount: number;
}

interface AssetResponse {
  current: Asset[];
  history: Asset[];
  stats: AssetStats;
}

// Helper function to format dates
const formatDate = (date: string | undefined) => {
  if (!date) return '-';
  return format(new Date(date), 'MMM d, yyyy');
};

const AssetsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState<AssetResponse>({
    current: [],
    history: [],
    stats: { totalAssigned: 0, byType: {}, overdueCount: 0 }
  });

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await api.get<AssetResponse>('/api/employee/assets');
      setData(res.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  // Filter function for assets
  const filterAssets = (assets: Asset[]) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return assets;
    return assets.filter((asset) => 
      asset.assetName.toLowerCase().includes(term) ||
      asset.assetType.toLowerCase().includes(term) ||
      (asset.brand || '').toLowerCase().includes(term) ||
      (asset.model || '').toLowerCase().includes(term) ||
      (asset.serialNumber || '').toLowerCase().includes(term)
    );
  };

  const renderStatistics = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Assigned Assets
            </Typography>
            <Typography variant="h4">
              {data.stats.totalAssigned}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Overdue Assets
            </Typography>
            <Typography variant="h4" color={data.stats.overdueCount > 0 ? 'error' : 'inherit'}>
              {data.stats.overdueCount}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Assets by Type
            </Typography>
            {Object.entries(data.stats.byType).map(([type, count]) => (
              <Box key={type} display="flex" justifyContent="space-between" mb={1}>
                <Typography>{type}:</Typography>
                <Typography>{count}</Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderAssetTable = (assets: Asset[]) => (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Asset Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Brand/Model</TableCell>
            <TableCell>Assigned Date</TableCell>
            <TableCell>Expected Return</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filterAssets(assets).map((asset) => {
            const isOverdue = asset.expectedReturnDate && new Date(asset.expectedReturnDate) < new Date();
            
            return (
              <TableRow key={asset._id}>
                <TableCell>
                  {asset.assetName}
                  {isOverdue && (
                    <Tooltip title="Asset is overdue">
                      <WarningIcon color="error" fontSize="small" sx={{ ml: 1 }} />
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell>{asset.assetType}</TableCell>
                <TableCell>
                  <Chip 
                    label={asset.status} 
                    size="small" 
                    color={
                      asset.status === 'occupied' ? 'success' :
                      asset.status === 'maintenance' ? 'warning' :
                      'default'
                    } 
                  />
                </TableCell>
                <TableCell>{[asset.brand, asset.model].filter(Boolean).join(' / ')}</TableCell>
                <TableCell>{formatDate(asset.assignedDate)}</TableCell>
                <TableCell>{formatDate(asset.expectedReturnDate)}</TableCell>
                <TableCell>
                  <Tooltip title="View Details">
                    <IconButton size="small" onClick={() => {/* TODO: Show asset details dialog */}}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Assets
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {renderStatistics()}

          <Box sx={{ mt: 4 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                <Tab label="Current Assets" />
                <Tab label="Asset History" />
              </Tabs>
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <TextField
                size="small"
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ width: 360 }}
              />
            </Box>

            {activeTab === 0 ? (
              renderAssetTable(data.current)
            ) : (
              renderAssetTable(data.history)
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default AssetsPage;


