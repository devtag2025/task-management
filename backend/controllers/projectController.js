const { validationResult } = require('express-validator');
const Project = require('../models/Project');

const redactForTeamLead = (projectDoc) => {
  if (!projectDoc) return projectDoc;
  const project = projectDoc.toObject ? projectDoc.toObject() : projectDoc;
  const toHide = project.hiddenFieldsForTeamLead || [];
  toHide.forEach((field) => {
    if (field in project) delete project[field];
    if (field === 'milestones') project.milestones = undefined;
  });
  return project;
};

exports.list = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'teamlead') query.teamLead = req.user._id;
    if (req.user.role === 'employee') query.assignedTeam = req.user._id;
    const projects = await Project.find(query)
      .populate('createdBy', 'name email')
      .populate('teamLead', 'name email')
      .populate('assignedTeam', 'name email role')
      .sort({ createdAt: -1 });
    if (req.user.role === 'teamlead') {
      return res.json(projects.map(redactForTeamLead));
    }
    return res.json(projects);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.get = async (req, res) => {
  try {
    let query = { _id: req.params.id };
    if (req.user.role === 'teamlead') query.teamLead = req.user._id;
    if (req.user.role === 'employee') query.assignedTeam = req.user._id;
    const project = await Project.findOne(query)
      .populate('createdBy', 'name email')
      .populate('teamLead', 'name email')
      .populate('assignedTeam', 'name email role');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (req.user.role === 'teamlead') {
      return res.json(redactForTeamLead(project));
    }
    return res.json(project);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const data = { ...req.body, createdBy: req.user._id };
    const project = new Project(data);
    await project.save();
    const populated = await Project.findById(project._id)
      .populate('createdBy', 'name email')
      .populate('teamLead', 'name email')
      .populate('assignedTeam', 'name email role');
    return res.status(201).json({ message: 'Project created successfully', project: populated });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('createdBy', 'name email')
      .populate('teamLead', 'name email')
      .populate('assignedTeam', 'name email role');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    return res.json({ message: 'Project updated successfully', project });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.addMilestone = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { title, description, amount, dueDate } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    project.milestones.push({ title, description, amount, dueDate });
    await project.save();
    return res.json({ message: 'Milestone added', project });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update hidden fields configuration (admin only; route should protect)
exports.updateHiddenFields = async (req, res) => {
  try {
    const { hiddenFieldsForTeamLead } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { hiddenFieldsForTeamLead: hiddenFieldsForTeamLead || [] },
      { new: true, runValidators: true }
    );
    if (!project) return res.status(404).json({ message: 'Project not found' });
    return res.json({ message: 'Hidden fields updated', project });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};


