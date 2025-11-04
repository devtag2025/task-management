const express = require('express');
const { auth } = require('../middleware/auth');
const Asset = require('../models/Asset');

const router = express.Router();

// Get all assets (filtered by user role)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    // Filter based on user role
    if (req.user.role === 'employee') {
      query.assignedTo = req.user._id;
    }
    // Admin and team lead can see all assets

    const assets = await Asset.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(assets);
  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single asset
router.get('/:id', auth, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // Filter based on user role
    if (req.user.role === 'employee') {
      query.assignedTo = req.user._id;
    }

    const asset = await Asset.findOne(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    res.json(asset);
  } catch (error) {
    console.error('Get asset error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
