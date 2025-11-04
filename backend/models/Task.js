const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema({
  startTime: {
    type: Date,
    required: true
  },
  endTime: Date,
  duration: Number, // in minutes
  description: String,
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'paused'],
    default: 'in-progress'
  }
});

const statusHistorySchema = new mongoose.Schema({
  from: {
    type: String,
    required: true,
    enum: ['pending', 'in-progress', 'completed', 'on-hold', 'cancelled']
  },
  to: {
    type: String,
    required: true,
    enum: ['pending', 'in-progress', 'completed', 'on-hold', 'cancelled']
  },
  comment: {
    type: String,
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedAt: {
    type: Date,
    required: true
  }
});

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'on-hold', 'cancelled'],
    default: 'pending'
  },
  dueDate: {
    type: Date,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timeEntries: [timeEntrySchema],
  statusHistory: [statusHistorySchema],
  totalTimeSpent: {
    type: Number,
    default: 0 // in minutes
  },
  completedDate: Date
}, {
  timestamps: true
});

// Calculate total time spent
taskSchema.methods.calculateTotalTime = function() {
  this.totalTimeSpent = this.timeEntries.reduce((total, entry) => {
    return total + (entry.duration || 0);
  }, 0);
  return this.totalTimeSpent;
};

module.exports = mongoose.model('Task', taskSchema);
