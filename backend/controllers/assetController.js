const { validationResult } = require('express-validator');
const Asset = require('../models/Asset');
const User = require('../models/User');

exports.list = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'employee') query.assignedTo = req.user._id;
    const assets = await Asset.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    return res.json(assets);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.get = async (req, res) => {
  try {
    let query = { _id: req.params.id };
    if (req.user.role === 'employee') query.assignedTo = req.user._id;
    const asset = await Asset.findOne(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    return res.json(asset);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const data = { ...req.body, createdBy: req.user._id };
    const asset = new Asset(data);
    await asset.save();
    const populated = await Asset.findById(asset._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
    return res.status(201).json({ message: 'Asset created successfully', asset: populated });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.assign = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { employeeId, expectedReturnDate } = req.body;
    const employee = await User.findById(employeeId);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    if (asset.status !== 'available') return res.status(400).json({ message: 'Asset is not available' });
    asset.assignedTo = employeeId;
    asset.status = 'occupied';
    asset.assignedDate = new Date();
    asset.expectedReturnDate = expectedReturnDate ? new Date(expectedReturnDate) : null;
    await asset.save();
    await User.findByIdAndUpdate(employeeId, { $addToSet: { assignedAssets: asset._id } });
    const populated = await Asset.findById(asset._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
    return res.json({ message: 'Asset assigned successfully', asset: populated });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.returnAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    if (asset.status !== 'occupied') return res.status(400).json({ message: 'Asset is not currently assigned' });
    const previousAssignee = asset.assignedTo;
    asset.assignedTo = null;
    asset.status = 'available';
    asset.returnDate = new Date();
    asset.expectedReturnDate = null;
    await asset.save();
    if (previousAssignee) {
      await User.findByIdAndUpdate(previousAssignee, { $pull: { assignedAssets: asset._id } });
    }
    const populated = await Asset.findById(asset._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
    return res.json({ message: 'Asset returned successfully', asset: populated });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};


