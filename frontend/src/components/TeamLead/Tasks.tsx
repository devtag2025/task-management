import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
  Alert,
  Tooltip,
  CircularProgress,
  LinearProgress,
  FormHelperText
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import {
  Add as AddIcon,
  Assignment as AssignmentIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  SwapHoriz as SwapHorizIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import dayjs, { Dayjs } from 'dayjs';

interface TeamMember {
  _id: string;
  name: string;
  email: string;
}

interface Project {
  _id: string;
  projectName: string;
  status: string;
  deadline: string;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'on-hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: TeamMember;
  project: Project;
  dueDate: string;
  estimatedHours?: number;
  tags?: string[];
  dependencies?: string[];
  createdBy: {
    name: string;
    email: string;
  };
  reassignmentHistory?: Array<{
    fromEmployee: TeamMember;
    toEmployee: TeamMember;
    reason: string;
    date: string;
  }>;
}

interface WorkloadInfo {
  employeeId: string;
  name: string;
  email: string;
  activeTasks: number;
  completedTasks: number;
}

const Tasks: React.FC = () => {
  // State for tasks and filters
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workloadInfo, setWorkloadInfo] = useState<WorkloadInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('dueDate');
  const [sortOrder, setSortOrder] = useState('asc');

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Form states
  interface NewTask {
    title: string;
    description: string;
    assignedTo: string;
    project: string;
    dueDate: Dayjs;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    estimatedHours: number;
    tags: string[];
  }

  const [newTask, setNewTask] = useState<NewTask>({
    title: '',
    description: '',
    assignedTo: '',
    project: '',
    dueDate: dayjs(),
    priority: 'medium',
    estimatedHours: 1,
    tags: [],
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reassignReason, setReassignReason] = useState('');
  const [newAssignee, setNewAssignee] = useState('');

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Fetch tasks and related data
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/teamlead/tasks', {
        params: {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          priority: priorityFilter !== 'all' ? priorityFilter : undefined,
          assignedTo: assigneeFilter !== 'all' ? assigneeFilter : undefined,
          search: searchTerm || undefined,
          sortBy,
          sortOrder
        }
      });
      setTasks(response.data.tasks);
      setWorkloadInfo(response.data.workloadInfo);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await axios.get('/api/teamlead/team');
      setTeamMembers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load team members');
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/teamlead/projects');
      setProjects(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load projects');
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter, assigneeFilter, searchTerm, sortBy, sortOrder]);

  useEffect(() => {
    fetchTeamMembers();
    fetchProjects();
  }, []);

  // Handle task creation
  const handleCreateTask = async () => {
    try {
      await axios.post('/api/teamlead/tasks', newTask);
      setSuccess('Task created successfully');
      setCreateDialogOpen(false);
      fetchTasks();
      // Reset form
      setNewTask({
        title: '',
        description: '',
        assignedTo: '',
        project: '',
        dueDate: dayjs(),
        priority: 'medium',
        estimatedHours: 1,
        tags: [],
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create task');
    }
  };

  // Handle task reassignment
  const handleReassignTask = async () => {
    if (!selectedTask) return;

    try {
      await axios.put(`/api/teamlead/tasks/${selectedTask._id}`, {
        assignedTo: newAssignee,
        reassignReason
      });
      setSuccess('Task reassigned successfully');
      setReassignDialogOpen(false);
      fetchTasks();
      // Reset form
      setSelectedTask(null);
      setNewAssignee('');
      setReassignReason('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reassign task');
    }
  };

  // Render workload statistics
  const renderWorkloadStats = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {workloadInfo.map((info) => (
        <Grid item xs={12} md={4} key={info.employeeId}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {info.name}
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography color="textSecondary" variant="body2">
                  Active Tasks: {info.activeTasks}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(info.activeTasks / 10) * 100} 
                  color={info.activeTasks > 5 ? "error" : "primary"}
                  sx={{ mt: 1 }}
                />
              </Box>
              <Typography color="textSecondary" variant="body2">
                Completed: {info.completedTasks}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  // Render task filters
  const renderFilters = () => (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={2}>
        <FormControl fullWidth size="small">
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="in-progress">In Progress</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="on-hold">On Hold</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6} md={2}>
        <FormControl fullWidth size="small">
          <InputLabel>Priority</InputLabel>
          <Select
            value={priorityFilter}
            label="Priority"
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="urgent">Urgent</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6} md={2}>
        <FormControl fullWidth size="small">
          <InputLabel>Assignee</InputLabel>
          <Select
            value={assigneeFilter}
            label="Assignee"
            onChange={(e) => setAssigneeFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            {teamMembers.map((member) => (
              <MenuItem key={member._id} value={member._id}>
                {member.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <TextField
          fullWidth
          size="small"
          label="Search tasks"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={2}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Task
        </Button>
      </Grid>
    </Grid>
  );

  // Render task list
  const renderTasks = () => (
    <Paper sx={{ mt: 2 }}>
      {tasks.map((task) => (
        <Box
          key={task._id}
          sx={{
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            '&:last-child': { borderBottom: 'none' }
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <Typography variant="h6">{task.title}</Typography>
              <Typography variant="body2" color="textSecondary">
                {task.description}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} container spacing={1} alignItems="center">
              <Grid item>
                <Chip
                  label={task.status}
                  color={
                    task.status === 'completed' ? 'success' :
                    task.status === 'in-progress' ? 'primary' :
                    task.status === 'on-hold' ? 'warning' :
                    'default'
                  }
                  size="small"
                />
              </Grid>
              <Grid item>
                <Chip
                  label={task.priority}
                  color={
                    task.priority === 'urgent' ? 'error' :
                    task.priority === 'high' ? 'warning' :
                    'default'
                  }
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm="auto">
                <Typography variant="body2">
                  Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
                </Typography>
              </Grid>
              <Grid item>
                <Tooltip title="Reassign Task">
                  <IconButton 
                    size="small"
                    onClick={() => {
                      setSelectedTask(task);
                      setReassignDialogOpen(true);
                    }}
                  >
                    <SwapHorizIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      ))}
    </Paper>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Team Tasks
      </Typography>

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

      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab label="Tasks" />
        <Tab label="Workload" />
      </Tabs>

      {activeTab === 0 ? (
        <>
          {renderFilters()}
          {loading ? (
            <CircularProgress />
          ) : (
            renderTasks()
          )}
        </>
      ) : (
        renderWorkloadStats()
      )}

      {/* Create Task Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Task</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Assignee</InputLabel>
                <Select
                  value={newTask.assignedTo}
                  label="Assignee"
                  onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                >
                  {teamMembers.map((member) => (
                    <MenuItem key={member._id} value={member._id}>
                      {member.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Project</InputLabel>
                <Select
                  value={newTask.project}
                  label="Project"
                  onChange={(e) => setNewTask({ ...newTask, project: e.target.value })}
                >
                  {projects.map((project) => (
                    <MenuItem key={project._id} value={project._id}>
                      {project.projectName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <DateTimePicker
                label="Due Date"
                value={newTask.dueDate}
                onChange={(newValue: Dayjs | null) => {
                  if (newValue) {
                    setNewTask({ ...newTask, dueDate: newValue });
                  }
                }}
                slotProps={{
                  textField: {
                    fullWidth: true
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={newTask.priority}
                  label="Priority"
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as NewTask['priority'] })}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Estimated Hours"
                value={newTask.estimatedHours}
                onChange={(e) => setNewTask({ ...newTask, estimatedHours: Number(e.target.value) })}
                inputProps={{ min: "0.5", step: "0.5" }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tags"
                placeholder="Enter tags separated by commas"
                value={newTask.tags.join(', ')}
                onChange={(e) => setNewTask({ 
                  ...newTask, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateTask}
            disabled={!newTask.title || !newTask.assignedTo || !newTask.project}
          >
            Create Task
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reassign Task Dialog */}
      <Dialog
        open={reassignDialogOpen}
        onClose={() => {
          setReassignDialogOpen(false);
          setSelectedTask(null);
          setNewAssignee('');
          setReassignReason('');
        }}
      >
        <DialogTitle>Reassign Task</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>New Assignee</InputLabel>
                <Select
                  value={newAssignee}
                  label="New Assignee"
                  onChange={(e) => setNewAssignee(e.target.value)}
                >
                  {teamMembers
                    .filter(member => member._id !== selectedTask?.assignedTo._id)
                    .map((member) => (
                      <MenuItem key={member._id} value={member._id}>
                        {member.name}
                      </MenuItem>
                    ))
                  }
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Reason for Reassignment"
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setReassignDialogOpen(false);
            setSelectedTask(null);
            setNewAssignee('');
            setReassignReason('');
          }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleReassignTask}
            disabled={!newAssignee || !reassignReason}
          >
            Reassign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Tasks;
