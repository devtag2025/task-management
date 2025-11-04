const express = require('express');
const { auth } = require('../middleware/auth');
const Project = require('../models/Project');
const Task = require('../models/Task');
const projectController = require('../controllers/projectController');

const router = express.Router();

// Get all projects (accessible by all authenticated users)
router.get('/', auth, projectController.list);

// Get single project
router.get('/:id', auth, projectController.get);

// Get project tasks
router.get('/:id/tasks', auth, async (req, res) => {
  try {
    let projectQuery = { _id: req.params.id };
    
    // Filter based on user role
    if (req.user.role === 'teamlead') {
      projectQuery.teamLead = req.user._id;
    } else if (req.user.role === 'employee') {
      projectQuery.assignedTeam = req.user._id;
    }

    const project = await Project.findOne(projectQuery);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    let taskQuery = { project: req.params.id };
    
    // Filter tasks based on user role
    if (req.user.role === 'employee') {
      taskQuery.assignedTo = req.user._id;
    } else if (req.user.role === 'teamlead') {
      // Get team member IDs
      const teamMembers = await require('../models/User').find({ teamLead: req.user._id }).select('_id');
      const teamMemberIds = teamMembers.map(member => member._id);
      taskQuery.assignedTo = { $in: teamMemberIds };
    }

    const tasks = await Task.find(taskQuery)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error('Get project tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
