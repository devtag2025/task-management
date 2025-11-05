const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Task = require('../models/Task');
const Asset = require('../models/Asset');

const router = express.Router();

// All employee routes require employee role
router.use(auth, authorize('employee'));

// Get assigned tasks
router.get('/tasks', async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate('project', 'projectName status deadline')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ⚠️ MOVED UP - Get task statistics (MUST be before /tasks/:id)
router.get('/tasks/stats', async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments({ assignedTo: req.user._id });
    const completedTasks = await Task.countDocuments({ 
      assignedTo: req.user._id, 
      status: 'completed' 
    });
    const inProgressTasks = await Task.countDocuments({ 
      assignedTo: req.user._id, 
      status: 'in-progress' 
    });
    const pendingTasks = await Task.countDocuments({ 
      assignedTo: req.user._id, 
      status: 'pending' 
    });

    // Get overdue tasks
    const overdueTasks = await Task.countDocuments({
      assignedTo: req.user._id,
      dueDate: { $lt: new Date() },
      status: { $ne: 'completed' }
    });

    // Get total time spent
    const totalTimeSpent = await Task.aggregate([
      { $match: { assignedTo: req.user._id } },
      { $group: { _id: null, totalTime: { $sum: '$totalTimeSpent' } } }
    ]);

    res.json({
      total: totalTasks,
      completed: completedTasks,
      inProgress: inProgressTasks,
      pending: pendingTasks,
      overdue: overdueTasks,
      totalTimeSpent: totalTimeSpent[0]?.totalTime || 0,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    });
  } catch (error) {
    console.error('Task stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task status and progress
router.patch('/tasks/:id/status', [
  body('status').isIn(['pending', 'in-progress', 'completed', 'on-hold']),
  body('comment').optional().trim().isString(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify the task is assigned to this employee
    if (task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    const oldStatus = task.status;
    task.status = req.body.status;
    
    // Add status update to history if comment provided
    if (req.body.comment) {
      task.statusHistory = task.statusHistory || [];
      task.statusHistory.push({
        from: oldStatus,
        to: req.body.status,
        comment: req.body.comment,
        updatedBy: req.user._id,
        updatedAt: new Date()
      });
    }

    await task.save();

    const updatedTask = await Task.findById(req.params.id)
      .populate('project', 'projectName status deadline')
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    res.json(updatedTask);
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single task (AFTER /tasks/stats)
router.get('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ 
      _id: req.params.id, 
      assignedTo: req.user._id 
    })
    .populate('project', 'projectName status deadline')
    .populate('createdBy', 'name email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ... rest of your routes remain the same

// Get assigned assets with detailed information and history
router.get('/assets', async (req, res) => {
  try {
    // Get currently assigned assets
    const currentAssets = await Asset.find({ 
      assignedTo: req.user._id,
      status: 'occupied'
    })
    .populate('createdBy', 'name email')
    .sort({ assignedDate: -1 });

    // Get asset history (including returned assets)
    const assetHistory = await Asset.find({
      $or: [
        { assignedTo: req.user._id },
        { 'history.userId': req.user._id }
      ]
    })
    .select('assetName assetType brand model status assignedDate returnDate expectedReturnDate condition notes')
    .sort({ assignedDate: -1 });

    // Calculate statistics
    const stats = {
      totalAssigned: currentAssets.length,
      byType: currentAssets.reduce((acc, asset) => {
        acc[asset.assetType] = (acc[asset.assetType] || 0) + 1;
        return acc;
      }, {}),
      overdueCount: currentAssets.filter(asset => 
        asset.expectedReturnDate && new Date(asset.expectedReturnDate) < new Date()
      ).length
    };

    res.json({
      current: currentAssets,
      history: assetHistory,
      stats: stats
    });
  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single asset details
router.get('/assets/:id', async (req, res) => {
  try {
    const asset = await Asset.findOne({ 
      _id: req.params.id,
      $or: [
        { assignedTo: req.user._id },
        { 'history.userId': req.user._id }
      ]
    })
    .populate('createdBy', 'name email');

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found or not assigned to you' });
    }

    res.json(asset);
  } catch (error) {
    console.error('Get asset details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start working on task
router.post('/tasks/:id/start', async (req, res) => {
  try {
    const task = await Task.findOne({ 
      _id: req.params.id, 
      assignedTo: req.user._id 
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if there's already an active time entry
    const activeEntry = task.timeEntries.find(entry => entry.status === 'in-progress');
    if (activeEntry) {
      return res.status(400).json({ message: 'Task is already in progress' });
    }

    // Create new time entry
    const timeEntry = {
      startTime: new Date(),
      status: 'in-progress'
    };

    task.timeEntries.push(timeEntry);
    task.status = 'in-progress';
    await task.save();

    res.json({
      message: 'Task started successfully',
      task
    });
  } catch (error) {
    console.error('Start task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Stop working on task
router.post('/tasks/:id/stop', [
  body('description').optional().isString().withMessage('Description must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { description } = req.body;
    const task = await Task.findOne({ 
      _id: req.params.id, 
      assignedTo: req.user._id 
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Find active time entry
    const activeEntry = task.timeEntries.find(entry => entry.status === 'in-progress');
    if (!activeEntry) {
      return res.status(400).json({ message: 'No active time entry found' });
    }

    // Update time entry
    activeEntry.endTime = new Date();
    activeEntry.duration = Math.round((activeEntry.endTime - activeEntry.startTime) / (1000 * 60)); // in minutes
    activeEntry.status = 'completed';
    if (description) {
      activeEntry.description = description;
    }

    // Update total time spent
    task.calculateTotalTime();
    await task.save();

    res.json({
      message: 'Task stopped successfully',
      task
    });
  } catch (error) {
    console.error('Stop task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task status
router.put('/tasks/:id/status', [
  body('status').isIn(['pending', 'in-progress', 'completed', 'on-hold']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;
    const task = await Task.findOne({ 
      _id: req.params.id, 
      assignedTo: req.user._id 
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.status = status;
    if (status === 'completed') {
      task.completedDate = new Date();
    }
    await task.save();

    res.json({
      message: 'Task status updated successfully',
      task
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add task update/comment
router.post('/tasks/:id/updates', [
  body('description').notEmpty().withMessage('Description is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { description } = req.body;
    const task = await Task.findOne({ 
      _id: req.params.id, 
      assignedTo: req.user._id 
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Add update to time entries
    const updateEntry = {
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      description,
      status: 'completed'
    };

    task.timeEntries.push(updateEntry);
    await task.save();

    res.json({
      message: 'Task update added successfully',
      task
    });
  } catch (error) {
    console.error('Add task update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recent activity
router.get('/activity', async (req, res) => {
  try {
    const recentTasks = await Task.find({ assignedTo: req.user._id })
      .populate('project', 'projectName')
      .sort({ updatedAt: -1 })
      .limit(10);

    const recentAssets = await Asset.find({ assignedTo: req.user._id })
      .sort({ assignedDate: -1 })
      .limit(5);

    res.json({
      recentTasks,
      recentAssets
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;