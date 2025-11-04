import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  Chip,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  Email as EmailIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import axios from 'axios';

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  profile?: {
    department?: string;
    position?: string;
    phone?: string;
  };
  assignedAssets?: Array<{
    _id: string;
    assetName: string;
    assetType: string;
    status: string;
  }>;
}

interface AvailableEmployee {
  _id: string;
  name: string;
  email: string;
  profile?: {
    department?: string;
    position?: string;
  };
}

const MyTeamPage: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<AvailableEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [removeError, setRemoveError] = useState('');

  // Fetch team members and available employees
  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamRes, availableRes] = await Promise.all([
        axios.get<TeamMember[]>('/api/teamlead/team'),
        axios.get<AvailableEmployee[]>('/api/teamlead/available-employees')
      ]);
      setTeamMembers(teamRes.data);
      setAvailableEmployees(availableRes.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Add employee to team
  const handleAddEmployee = async (employeeId: string) => {
    try {
      await axios.post('/api/teamlead/team/add', { employeeId });
      await fetchData();
      setSuccess('Employee added to team successfully');
      setAddDialogOpen(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add employee');
    }
  };

  // Remove employee from team
  const handleRemoveEmployee = async () => {
    try {
      setRemoveError('');
      await axios.post('/api/teamlead/team/remove', { employeeId: selectedEmployee });
      await fetchData();
      setSuccess('Employee removed from team successfully');
      setRemoveDialogOpen(false);
      setSelectedEmployee('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setRemoveError(err.response?.data?.message || 'Failed to remove employee');
    }
  };

  // Filter team members based on search
  const filteredTeamMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.profile?.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.profile?.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Render team statistics
  const renderStatistics = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Team Size
            </Typography>
            <Typography variant="h4">
              {teamMembers.length}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Available Positions
            </Typography>
            <Typography variant="h4">
              {availableEmployees.length}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Departments
            </Typography>
            <Typography variant="body1">
              {Array.from(new Set(teamMembers.map(m => m.profile?.department).filter(Boolean))).join(', ') || 'None'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          My Team
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setAddDialogOpen(true)}
          disabled={availableEmployees.length === 0}
        >
          Add Team Member
        </Button>
      </Box>

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

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {renderStatistics()}

          <Box mb={2}>
            <TextField
              size="small"
              label="Search team members"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: 300 }}
            />
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell>Assets</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTeamMembers.map((member) => (
                  <TableRow key={member._id}>
                    <TableCell>{member.name}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <EmailIcon fontSize="small" sx={{ mr: 1 }} />
                        {member.email}
                      </Box>
                    </TableCell>
                    <TableCell>{member.profile?.department || '-'}</TableCell>
                    <TableCell>{member.profile?.position || '-'}</TableCell>
                    <TableCell>
                      {member.assignedAssets?.map((asset) => (
                        <Chip
                          key={asset._id}
                          label={asset.assetName}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Remove from team">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setSelectedEmployee(member._id);
                            setRemoveDialogOpen(true);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTeamMembers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No team members found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Add Employee Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add Team Member</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Select an employee to add to your team:
          </DialogContentText>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {availableEmployees.map((employee) => (
                  <TableRow key={employee._id}>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.profile?.department || '-'}</TableCell>
                    <TableCell>{employee.profile?.position || '-'}</TableCell>
                    <TableCell align="right">
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => handleAddEmployee(employee._id)}
                      >
                        Add
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {availableEmployees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No available employees found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Remove Employee Dialog */}
      <Dialog
        open={removeDialogOpen}
        onClose={() => {
          setRemoveDialogOpen(false);
          setSelectedEmployee('');
          setRemoveError('');
        }}
      >
        <DialogTitle>Remove Team Member</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove this team member?
            {removeError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {removeError}
              </Alert>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setRemoveDialogOpen(false);
              setSelectedEmployee('');
              setRemoveError('');
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleRemoveEmployee} 
            color="error" 
            variant="contained"
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyTeamPage;
