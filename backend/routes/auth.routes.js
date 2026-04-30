import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Agent from '../models/Agent.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretkey', {
    expiresIn: '30d',
  });
};

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { name, password } = req.body;

  try {
    const agent = await Agent.findOne({ name });

    if (agent && (await bcrypt.compare(password, agent.password))) {
      res.json({
        _id: agent._id,
        name: agent.name,
        role: agent.role,
        token: generateToken(agent._id),
      });
    } else {
      res.status(401).json({ error: 'Invalid name or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const agent = await Agent.findById(req.agent.id).select('-password');
    res.json(agent);
  } catch (error) {
    console.error('Fetch me error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
