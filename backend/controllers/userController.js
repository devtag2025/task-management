const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

// Helpers
const signToken = (user) => {
  return jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
};

// Public signup (role always employee)
exports.signup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ name, email, password, role: 'employee' });
    await user.save();

    const token = signToken(user);
    return res.status(201).json({
      message: 'Signup successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error during signup' });
  }
};

// Admin create user (kept for admin panel)
exports.adminCreateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role = 'employee', teamLead } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const user = new User({ name, email, password, role, teamLead: teamLead || null });
    await user.save();

    return res.status(201).json({
      message: 'User created successfully',
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error creating user' });
  }
};

// Me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, address, department, position } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData['profile.phone'] = phone;
    if (address) updateData['profile.address'] = address;
    if (department) updateData['profile.department'] = department;
    if (position) updateData['profile.position'] = position;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true }).select('-password');
    return res.json({ message: 'Profile updated successfully', user });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    return res.json({ message: 'Password changed successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Admin: change role
exports.adminChangeRole = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ message: 'Role updated successfully', user });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Admin: list employees
exports.adminListEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: { $in: ['employee', 'teamlead'] } })
      .select('-password')
      .populate('teamLead', 'name email')
      .populate('assignedAssets', 'assetName assetType status');
    return res.json(employees);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.adminGetEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id)
      .select('-password')
      .populate('teamLead', 'name email')
      .populate('assignedAssets', 'assetName assetType status');
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    return res.json(employee);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.adminSetActive = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { isActive } = req.body;
    const employee = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select('-password');
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    return res.json({ message: 'Employee status updated successfully', employee });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.adminAssignTeamLead = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { teamLeadId } = req.body;
    const teamLead = await User.findOne({ _id: teamLeadId, role: 'teamlead' });
    if (!teamLead) return res.status(400).json({ message: 'Team lead not found' });
    const employee = await User.findByIdAndUpdate(req.params.id, { teamLead: teamLeadId }, { new: true })
      .select('-password')
      .populate('teamLead', 'name email');
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    return res.json({ message: 'Team lead assigned successfully', employee });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};


