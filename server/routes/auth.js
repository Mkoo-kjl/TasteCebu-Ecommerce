const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'tastecebu_fallback_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, security_question, security_answer } = req.body;

    // Validation
    if (!name || !email || !password || !security_question || !security_answer) {
      return res.status(400).json({ message: 'All required fields must be filled.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }

    // Check if email exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    // Hash password and security answer
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const hashed_answer = await bcrypt.hash(security_answer.toLowerCase().trim(), salt);

    // Insert user
    const [result] = await db.query(
      `INSERT INTO users (name, email, password_hash, phone, security_question, security_answer, role)
       VALUES (?, ?, ?, ?, ?, ?, 'user')`,
      [name.trim(), email.toLowerCase().trim(), password_hash, phone || '', security_question, hashed_answer]
    );

    // Create default settings
    await db.query(
      'INSERT INTO user_settings (user_id, theme, notifications_enabled) VALUES (?, ?, ?)',
      [result.insertId, 'light', 1]
    );

    // Generate token
    const token = jwt.sign({ id: result.insertId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Get user data
    const [users] = await db.query(
      'SELECT id, name, email, phone, address, avatar, role, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Registration successful!',
      token,
      user: users[0],
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Find user
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = users[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Generate token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
        role: user.role,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// POST /api/auth/forgot-password - Step 1: verify email, get security question
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const [users] = await db.query('SELECT id, security_question FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'No account found with this email.' });
    }

    res.json({
      user_id: users[0].id,
      security_question: users[0].security_question,
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/auth/reset-password - Step 2: verify answer and reset
router.post('/reset-password', async (req, res) => {
  try {
    const { user_id, security_answer, new_password } = req.body;

    if (!user_id || !security_answer || !new_password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const [users] = await db.query('SELECT security_answer FROM users WHERE id = ?', [user_id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Verify security answer
    const isMatch = await bcrypt.compare(security_answer.toLowerCase().trim(), users[0].security_answer);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect security answer.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(new_password, salt);

    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, user_id]);

    res.json({ message: 'Password reset successful! You can now login with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, name, email, phone, address, avatar, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ user: users[0] });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
