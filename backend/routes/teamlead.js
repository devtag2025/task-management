const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Project = require('../models/Project');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');

const router = express.Router();

// All team lead routes require teamlead role
router.use(auth, authorize('teamlead'));

// Get team members
router.get('/team', async (req, res) => {
  try {
    const teamMembers = await User.find({ teamLead: req.user._id })
      .select('-password')
      .populate('assignedAssets', 'assetName assetType status');
    
    res.json(teamMembers);
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available employees (employees without a team lead)
router.get('/available-employees', async (req, res) => {
  try {
    const availableEmployees = await User.find({ 
      role: 'employee',
      teamLead: null,
      isActive: true
    })
    .select('name email profile.department profile.position')
    .sort('name');

    res.json(availableEmployees);
  } catch (error) {
    console.error('Get available employees error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add employee to team
router.post('/team/add', [
  body('employeeId').isMongoId().withMessage('Valid employee ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { employeeId } = req.body;

    // Check if employee exists and is available
    const employee = await User.findOne({ 
      _id: employeeId,
      role: 'employee',
      teamLead: null,
      isActive: true
    });

    if (!employee) {
      return res.status(400).json({ 
        message: 'Employee not found or not available for assignment' 
      });
    }

    // Check team size limit (optional: you can add a limit if needed)
    const currentTeamSize = await User.countDocuments({ teamLead: req.user._id });
    const TEAM_SIZE_LIMIT = 10; // Adjust this number as needed
    if (currentTeamSize >= TEAM_SIZE_LIMIT) {
      return res.status(400).json({ 
        message: 'Team size limit reached' 
      });
    }

    // Assign employee to team lead
    employee.teamLead = req.user._id;
    await employee.save();

    const updatedEmployee = await User.findById(employeeId)
      .select('-password')
      .populate('assignedAssets', 'assetName assetType status');

    res.json({
      message: 'Employee added to team successfully',
      employee: updatedEmployee
    });
  } catch (error) {
    console.error('Add team member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove employee from team
router.post('/team/remove', [
  body('employeeId').isMongoId().withMessage('Valid employee ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { employeeId } = req.body;

    // Check if employee exists and is in the team lead's team
    const employee = await User.findOne({ 
      _id: employeeId,
      teamLead: req.user._id
    });

    if (!employee) {
      return res.status(404).json({ 
        message: 'Employee not found in your team' 
      });
    }

    // Check if employee has any ongoing tasks
    const ongoingTasks = await Task.countDocuments({
      assignedTo: employeeId,
      status: { $in: ['pending', 'in-progress'] }
    });

    if (ongoingTasks > 0) {
      return res.status(400).json({
        message: 'Cannot remove employee with ongoing tasks. Please reassign or complete their tasks first.'
      });
    }

    // Remove employee from team
    employee.teamLead = null;
    await employee.save();

    res.json({
      message: 'Employee removed from team successfully',
      employeeId
    });
  } catch (error) {
    console.error('Remove team member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get projects assigned to team lead
router.get('/projects', async (req, res) => {
  try {
    const projects = await Project.find({ teamLead: req.user._id })
      .populate('createdBy', 'name email')
      .populate('assignedTeam', 'name email role');
    
    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update limited project fields (status, priority) by team lead on their projects
router.put('/projects/:id', [
  body('status').optional().isIn(['planning', 'in-progress', 'completed', 'on-hold', 'cancelled']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const project = await Project.findOne({ _id: req.params.id, teamLead: req.user._id });
    if (!project) {
      return res.status(404).json({ message: 'Project not found or not assigned to you' });
    }

    const updates = {};
    if (req.body.status) updates.status = req.body.status;
    if (req.body.priority) updates.priority = req.body.priority;

    const updated = await Project.findByIdAndUpdate(project._id, updates, { new: true, runValidators: true });
    return res.json({ message: 'Project updated', project: updated });
  } catch (error) {
    console.error('TL update project error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get all tasks for team lead's team with filtering and sorting
router.get('/tasks', async (req, res) => {
  try {
    const { status, priority, assignedTo, search, sortBy = 'dueDate', sortOrder = 'asc' } = req.query;

    // Get team member IDs
    const teamMembers = await User.find({ teamLead: req.user._id }).select('_id name email');
    const teamMemberIds = teamMembers.map(member => member._id);

    // Build query
    let query = { assignedTo: { $in: teamMemberIds } };
    
    if (status) {
      query.status = status;
    }
    if (priority) {
      query.priority = priority;
    }
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with sorting
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('project', 'projectName status deadline priority')
      .populate('createdBy', 'name email')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 });
    
    // Add workload info
    const workloadInfo = await Promise.all(teamMembers.map(async (member) => {
      const activeTasksCount = await Task.countDocuments({
        assignedTo: member._id,
        status: { $in: ['pending', 'in-progress'] }
      });

      const completedTasksCount = await Task.countDocuments({
        assignedTo: member._id,
        status: 'completed'
      });

      return {
        employeeId: member._id,
        name: member.name,
        email: member.email,
        activeTasks: activeTasksCount,
        completedTasks: completedTasksCount
      };
    }));

    res.json({
      tasks,
      workloadInfo,
      totalTasks: tasks.length
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get workload statistics for team members
router.get('/tasks/workload', async (req, res) => {
  try {
    const teamMembers = await User.find({ teamLead: req.user._id }).select('_id name email');
    
    const workloadStats = await Promise.all(teamMembers.map(async (member) => {
      const taskStats = await Task.aggregate([
        { $match: { assignedTo: member._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalTimeSpent: { $sum: '$totalTimeSpent' }
          }
        }
      ]);

      const overdueTasks = await Task.countDocuments({
        assignedTo: member._id,
        status: { $ne: 'completed' },
        dueDate: { $lt: new Date() }
      });

      return {
        employeeId: member._id,
        name: member.name,
        email: member.email,
        tasksByStatus: taskStats.reduce((acc, stat) => ({
          ...acc,
          [stat._id]: stat.count
        }), {}),
        totalTimeSpent: taskStats.reduce((acc, stat) => acc + (stat.totalTimeSpent || 0), 0),
        overdueTasks
      };
    }));

    res.json(workloadStats);
  } catch (error) {
    console.error('Get workload stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new task with enhanced validation and checks
router.post('/tasks', [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('assignedTo').isMongoId().withMessage('Valid employee ID is required'),
  body('project').isMongoId().withMessage('Valid project ID is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('priority').isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('estimatedHours').optional().isFloat({ min: 0.5 }).withMessage('Estimated hours must be at least 0.5'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('dependencies').optional().isArray().withMessage('Dependencies must be an array of task IDs'),
  body('milestoneId').optional().isMongoId().withMessage('Valid milestone ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      title, 
      description, 
      assignedTo, 
      project, 
      dueDate, 
      priority,
      estimatedHours,
      tags,
      dependencies,
      milestoneId
    } = req.body;

    // Check if assigned employee is in team lead's team
    const employee = await User.findOne({ _id: assignedTo, teamLead: req.user._id });
    if (!employee) {
      return res.status(400).json({ message: 'Employee is not in your team' });
    }

    // Check if project is assigned to team lead
    const projectExists = await Project.findOne({ _id: project, teamLead: req.user._id });
    if (!projectExists) {
      return res.status(400).json({ message: 'Project is not assigned to you' });
    }

    // Check employee's current workload
    const activeTasksCount = await Task.countDocuments({
      assignedTo,
      status: { $in: ['pending', 'in-progress'] }
    });

    const WORKLOAD_WARNING_THRESHOLD = 5; // Configurable threshold
    if (activeTasksCount >= WORKLOAD_WARNING_THRESHOLD) {
      return res.status(400).json({ 
        message: 'Warning: Employee has too many active tasks',
        currentWorkload: activeTasksCount
      });
    }

    // Validate dependencies if provided
    if (dependencies?.length) {
      const dependencyTasks = await Task.find({ 
        _id: { $in: dependencies },
        project: project
      });

      if (dependencyTasks.length !== dependencies.length) {
        return res.status(400).json({ 
          message: 'One or more dependency tasks not found in this project'
        });
      }
    }

    const taskData = {
      title,
      description,
      assignedTo,
      project,
      dueDate,
      priority,
      estimatedHours,
      tags,
      dependencies,
      milestoneId,
      createdBy: req.user._id
    };

    const task = new Task(taskData);
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('project', 'projectName status deadline priority')
      .populate('createdBy', 'name email')
      .populate('dependencies', 'title status');

    res.status(201).json({
      message: 'Task created successfully',
      task: populatedTask
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update or reassign task
router.put('/tasks/:id', [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().notEmpty().withMessage('Description cannot be empty'),
  body('assignedTo').optional().isMongoId().withMessage('Valid employee ID is required'),
  body('status').optional().isIn(['pending', 'in-progress', 'completed', 'on-hold', 'cancelled']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('dueDate').optional().isISO8601().withMessage('Valid due date is required'),
  body('estimatedHours').optional().isFloat({ min: 0.5 }).withMessage('Estimated hours must be at least 0.5'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('reassignReason').optional().notEmpty().withMessage('Reason for reassignment is required when changing assignee')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('project', 'projectName status deadline');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if task belongs to team lead's team
    const currentEmployee = await User.findOne({ _id: task.assignedTo, teamLead: req.user._id });
    if (!currentEmployee) {
      return res.status(403).json({ message: 'You can only update tasks for your team members' });
    }

    const updates = { ...req.body };
    
    // Handle reassignment
    if (updates.assignedTo && updates.assignedTo !== task.assignedTo.toString()) {
      // Require reason for reassignment
      if (!updates.reassignReason) {
        return res.status(400).json({ message: 'Please provide a reason for reassignment' });
      }

      // Check if new assignee is in team lead's team
      const newAssignee = await User.findOne({ _id: updates.assignedTo, teamLead: req.user._id });
      if (!newAssignee) {
        return res.status(400).json({ message: 'New assignee must be a member of your team' });
      }

      // Check new assignee's workload
      const activeTasksCount = await Task.countDocuments({
        assignedTo: updates.assignedTo,
        status: { $in: ['pending', 'in-progress'] }
      });

      const WORKLOAD_WARNING_THRESHOLD = 5;
      if (activeTasksCount >= WORKLOAD_WARNING_THRESHOLD) {
        return res.status(400).json({ 
          message: 'Warning: New assignee has too many active tasks',
          currentWorkload: activeTasksCount
        });
      }

      // Add reassignment history
      if (!task.reassignmentHistory) {
        task.reassignmentHistory = [];
      }

      task.reassignmentHistory.push({
        fromEmployee: task.assignedTo,
        toEmployee: updates.assignedTo,
        reason: updates.reassignReason,
        reassignedBy: req.user._id,
        date: new Date()
      });
    }

    // Update task
    Object.assign(task, updates);
    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('project', 'projectName status deadline priority')
      .populate('createdBy', 'name email')
      .populate('reassignmentHistory.fromEmployee', 'name email')
      .populate('reassignmentHistory.toEmployee', 'name email')
      .populate('reassignmentHistory.reassignedBy', 'name email');

    // If task is completed, check if all dependent tasks are also completed
    if (updates.status === 'completed') {
      const dependentTasks = await Task.find({ dependencies: task._id });
      if (dependentTasks.length > 0) {
        const dependentTasksInfo = dependentTasks.map(t => ({
          id: t._id,
          title: t.title,
          status: t.status
        }));
        
        return res.json({
          message: 'Task updated successfully. Note: This task has dependent tasks.',
          task: updatedTask,
          dependentTasks: dependentTasksInfo
        });
      }
    }

    res.json({
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get task statistics
router.get('/tasks/stats', async (req, res) => {
  try {
    // Get team member IDs
    const teamMembers = await User.find({ teamLead: req.user._id }).select('_id');
    const teamMemberIds = teamMembers.map(member => member._id);

    const totalTasks = await Task.countDocuments({ assignedTo: { $in: teamMemberIds } });
    const completedTasks = await Task.countDocuments({ 
      assignedTo: { $in: teamMemberIds }, 
      status: 'completed' 
    });
    const inProgressTasks = await Task.countDocuments({ 
      assignedTo: { $in: teamMemberIds }, 
      status: 'in-progress' 
    });
    const pendingTasks = await Task.countDocuments({ 
      assignedTo: { $in: teamMemberIds }, 
      status: 'pending' 
    });

    // Get overdue tasks
    const overdueTasks = await Task.countDocuments({
      assignedTo: { $in: teamMemberIds },
      dueDate: { $lt: new Date() },
      status: { $ne: 'completed' }
    });

    res.json({
      total: totalTasks,
      completed: completedTasks,
      inProgress: inProgressTasks,
      pending: pendingTasks,
      overdue: overdueTasks
    });
  } catch (error) {
    console.error('Task stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get team performance
router.get('/team/performance', async (req, res) => {
  try {
    const teamMembers = await User.find({ teamLead: req.user._id }).select('_id name email');
    
    const performance = await Promise.all(
      teamMembers.map(async (member) => {
        const totalTasks = await Task.countDocuments({ assignedTo: member._id });
        const completedTasks = await Task.countDocuments({ 
          assignedTo: member._id, 
          status: 'completed' 
        });
        const totalTimeSpent = await Task.aggregate([
          { $match: { assignedTo: member._id } },
          { $group: { _id: null, totalTime: { $sum: '$totalTimeSpent' } } }
        ]);

        return {
          employee: {
            id: member._id,
            name: member.name,
            email: member.email
          },
          totalTasks,
          completedTasks,
          completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
          totalTimeSpent: totalTimeSpent[0]?.totalTime || 0
        };
      })
    );

    res.json(performance);
  } catch (error) {
    console.error('Team performance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
