const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  assetName: {
    type: String,
    required: true,
    trim: true
  },
  assetType: {
    type: String,
    enum: ['laptop', 'mouse', 'keyboard', 'headphone', 'charger', 'bag'],
    required: true
  },
  brand: String,
  model: String,
  serialNumber: String,
  specifications: {
    processor: String,
    ram: String,
    rom: String,
    other: String
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance', 'retired'],
    default: 'available'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedDate: Date,
  returnDate: Date,
  expectedReturnDate: Date,
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },
  purchaseDate: Date,
  purchasePrice: Number,
  warrantyExpiry: Date,
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Asset', assetSchema);
