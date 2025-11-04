const express = require('express');
const { auth } = require('../middleware/auth');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');

const router = express.Router();

// Get all tasks (filtered by user role)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    // Filter based on user role
    if (req.user.role === 'employee') {
      query.assignedTo = req.user._id;
    } else if (req.user.role === 'teamlead') {
      // Get team member IDs
      const teamMembers = await User.find({ teamLead: req.user._id }).select('_id');
      const teamMemberIds = teamMembers.map(member => member._id);
      query.assignedTo = { $in: teamMemberIds };
    }
    // Admin can see all tasks (no filter)

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('project', 'projectName status')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single task
router.get('/:id', auth, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // Filter based on user role
    if (req.user.role === 'employee') {
      query.assignedTo = req.user._id;
    } else if (req.user.role === 'teamlead') {
      // Check if task belongs to team lead's team
      const teamMembers = await User.find({ teamLead: req.user._id }).select('_id');
      const teamMemberIds = teamMembers.map(member => member._id);
      query.assignedTo = { $in: teamMemberIds };
    }

    const task = await Task.findOne(query)
      .populate('assignedTo', 'name email')
      .populate('project', 'projectName status')
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

module.exports = router;
