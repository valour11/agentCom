import express from 'express';
import bcrypt from 'bcryptjs';
import Agent from '../models/Agent.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// @route   POST /api/admin/agents
// @desc    Create a new agent
// @access  Private/Admin
router.post('/agents', protect, authorize('admin'), async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ error: 'Please provide name and password' });
  }

  try {
    const agentExists = await Agent.findOne({ name });

    if (agentExists) {
      return res.status(400).json({ error: 'Agent already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const agent = await Agent.create({
      name,
      password: hashedPassword,
      role: 'agent',
    });

    if (agent) {
      res.status(201).json({
        _id: agent._id,
        name: agent.name,
        role: agent.role,
      });
    } else {
      res.status(400).json({ error: 'Invalid agent data' });
    }
  } catch (error) {
    console.error('Create agent error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/admin/agents
// @desc    Get all agents
// @access  Private/Admin
router.get('/agents', protect, authorize('admin'), async (req, res) => {
  try {
    const agents = await Agent.find({ role: 'agent' }).select('-password');
    res.json(agents);
  } catch (error) {
    console.error('Fetch agents error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
