const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  amount: {
    type: Number,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  completedDate: Date
});

const projectSchema = new mongoose.Schema({
  projectName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  deadline: {
    type: Date,
    required: true
  },
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  clientEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  clientPhone: {
    type: String,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  projectPlatform: {
    type: String,
    required: true
  },
  projectProfile: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['planning', 'in-progress', 'completed', 'on-hold', 'cancelled'],
    default: 'planning'
  },
  category: {
    type: String,
    enum: ['fixed', 'hourly', 'milestone'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  // Admin-configured list of fields to hide from team leads when viewing this project
  hiddenFieldsForTeamLead: [{
    type: String,
    enum: [
      'description',
      'deadline',
      'clientName',
      'clientEmail',
      'clientPhone',
      'totalPrice',
      'projectPlatform',
      'projectProfile',
      'status',
      'category',
      'priority',
      'milestones'
    ]
  }],
  milestones: [milestoneSchema],
  assignedTeam: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  teamLead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Project', projectSchema);
