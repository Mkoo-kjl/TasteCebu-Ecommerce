const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/profile
router.get('/profile', requireAuth, async (req, res) => {
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
    console.error('Get profile error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/users/profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { name, email, phone, address, avatar } = req.body;

    // Validate email if changed
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format.' });
      }
      // Check if email is taken by another user
      const [existing] = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [email.toLowerCase().trim(), req.user.id]);
      if (existing.length > 0) {
        return res.status(400).json({ message: 'Email is already taken by another user.' });
      }
    }

    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name.trim()); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email.toLowerCase().trim()); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
    if (address !== undefined) { updates.push('address = ?'); values.push(address); }
    if (avatar !== undefined) { updates.push('avatar = ?'); values.push(avatar); }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update.' });
    }

    values.push(req.user.id);
    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    // Return updated user
    const [users] = await db.query(
      'SELECT id, name, email, phone, address, avatar, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({ message: 'Profile updated successfully.', user: users[0] });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/users/password
router.put('/password', requireAuth, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'Current password and new password are required.' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    // Verify current password
    const [users] = await db.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    const isMatch = await bcrypt.compare(current_password, users[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(new_password, salt);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, req.user.id]);

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/users/settings
router.get('/settings', requireAuth, async (req, res) => {
  try {
    const [settings] = await db.query('SELECT theme, notifications_enabled FROM user_settings WHERE user_id = ?', [req.user.id]);
    if (settings.length === 0) {
      // Create default settings
      await db.query('INSERT INTO user_settings (user_id, theme, notifications_enabled) VALUES (?, ?, ?)', [req.user.id, 'light', 1]);
      return res.json({ settings: { theme: 'light', notifications_enabled: 1 } });
    }
    res.json({ settings: settings[0] });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/users/settings
router.put('/settings', requireAuth, async (req, res) => {
  try {
    const { theme, notifications_enabled } = req.body;

    const updates = [];
    const values = [];

    if (theme !== undefined) { updates.push('theme = ?'); values.push(theme); }
    if (notifications_enabled !== undefined) { updates.push('notifications_enabled = ?'); values.push(notifications_enabled ? 1 : 0); }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No settings to update.' });
    }

    // Upsert settings
    const [existing] = await db.query('SELECT id FROM user_settings WHERE user_id = ?', [req.user.id]);
    if (existing.length === 0) {
      await db.query(
        'INSERT INTO user_settings (user_id, theme, notifications_enabled) VALUES (?, ?, ?)',
        [req.user.id, theme || 'light', notifications_enabled !== undefined ? (notifications_enabled ? 1 : 0) : 1]
      );
    } else {
      values.push(req.user.id);
      await db.query(`UPDATE user_settings SET ${updates.join(', ')} WHERE user_id = ?`, values);
    }

    const [settings] = await db.query('SELECT theme, notifications_enabled FROM user_settings WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'Settings updated.', settings: settings[0] });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
