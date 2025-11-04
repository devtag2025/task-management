const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Project = require('../models/Project');
const Asset = require('../models/Asset');
const Task = require('../models/Task');

const userController = require('../controllers/userController');
const projectController = require('../controllers/projectController');
const assetController = require('../controllers/assetController');
const router = express.Router();

// All admin routes require admin role
router.use(auth, authorize('admin'));

// Get all employees
router.get('/employees', userController.adminListEmployees);

// Get single employee
router.get('/employees/:id', userController.adminGetEmployee);

// Update employee status (active/inactive)
router.put('/employees/:id/status', [body('isActive').isBoolean().withMessage('isActive must be boolean')], userController.adminSetActive);

// Assign team lead to employee
router.put('/employees/:id/teamlead', [body('teamLeadId').isMongoId().withMessage('Valid team lead ID is required')], userController.adminAssignTeamLead);

// Admin: change a user's role
router.put('/employees/:id/role', [body('role').isIn(['admin', 'teamlead', 'employee']).withMessage('Invalid role')], userController.adminChangeRole);

// Get all projects
router.get('/projects', projectController.list);

// Create new project
router.post('/projects', [
  body('projectName').notEmpty().withMessage('Project name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('deadline').isISO8601().withMessage('Valid deadline is required'),
  body('clientName').notEmpty().withMessage('Client name is required'),
  body('clientEmail').isEmail().withMessage('Valid client email is required'),
  body('clientPhone').notEmpty().withMessage('Client phone is required'),
  body('totalPrice').isNumeric().withMessage('Total price must be a number'),
  body('projectPlatform').notEmpty().withMessage('Project platform is required'),
  body('projectProfile').notEmpty().withMessage('Project profile is required'),
  body('category').isIn(['fixed', 'hourly', 'milestone']).withMessage('Invalid category'),
  body('priority').isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority')
], projectController.create);

// Update project
router.put('/projects/:id', projectController.update);

// Update which fields are hidden from team leads for a project
router.put('/projects/:id/hidden-fields', [
  body('hiddenFieldsForTeamLead').isArray().withMessage('hiddenFieldsForTeamLead must be an array')
], projectController.updateHiddenFields);

// Get all assets
router.get('/assets', assetController.list);

// Create new asset
router.post('/assets', [
  body('assetName').notEmpty().withMessage('Asset name is required'),
  body('assetType').isIn(['laptop', 'mouse', 'keyboard', 'headphone', 'charger', 'bag']).withMessage('Invalid asset type'),
  body('status').isIn(['available', 'occupied', 'maintenance', 'retired']).withMessage('Invalid status')
], assetController.create);

// Update asset
router.put('/assets/:id', [
  body('assetName').optional().notEmpty(),
  body('assetType').optional().isIn(['laptop', 'mouse', 'keyboard', 'headphone', 'charger', 'bag']),
  body('status').optional().isIn(['available', 'occupied', 'maintenance', 'retired'])
], async (req, res) => {
  try {
    const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    return res.json({ message: 'Asset updated successfully', asset });
  } catch (error) {
    console.error('Update asset error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Assign asset to employee
router.put('/assets/:id/assign', [body('employeeId').isMongoId().withMessage('Valid employee ID is required'), body('expectedReturnDate').optional().isISO8601().withMessage('Valid return date is required')], assetController.assign);

// Return asset
router.put('/assets/:id/return', assetController.returnAsset);

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const totalEmployees = await User.countDocuments({ role: { $in: ['employee', 'teamlead'] } });
    const activeEmployees = await User.countDocuments({ role: { $in: ['employee', 'teamlead'] }, isActive: true });
    const totalProjects = await Project.countDocuments();
    const activeProjects = await Project.countDocuments({ status: { $in: ['planning', 'in-progress'] } });
    const totalAssets = await Asset.countDocuments();
    const availableAssets = await Asset.countDocuments({ status: 'available' });
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'completed' });

    res.json({
      employees: {
        total: totalEmployees,
        active: activeEmployees,
        inactive: totalEmployees - activeEmployees
      },
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: totalProjects - activeProjects
      },
      assets: {
        total: totalAssets,
        available: availableAssets,
        occupied: totalAssets - availableAssets
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        pending: totalTasks - completedTasks
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
