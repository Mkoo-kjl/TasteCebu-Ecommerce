const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/applications
router.get('/applications', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    let query = `SELECT sa.*, u.name as user_name, u.email as user_email
                 FROM seller_applications sa JOIN users u ON sa.user_id = u.id`;
    const values = [];

    if (status && status !== 'all') {
      query += ' WHERE sa.status = ?';
      values.push(status);
    }
    query += ' ORDER BY sa.created_at DESC';

    const [applications] = await db.query(query, values);
    res.json({ applications });
  } catch (err) {
    console.error('Get applications error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/admin/applications/:id
router.put('/applications/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status, admin_notes } = req.body;
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected.' });
    }

    const [apps] = await db.query('SELECT * FROM seller_applications WHERE id = ?', [req.params.id]);
    if (apps.length === 0) return res.status(404).json({ message: 'Application not found.' });

    await db.query('UPDATE seller_applications SET status = ?, admin_notes = ? WHERE id = ?',
      [status, admin_notes || null, req.params.id]);

    // If approved, update user role to seller
    if (status === 'approved') {
      await db.query('UPDATE users SET role = ? WHERE id = ?', ['seller', apps[0].user_id]);
    }

    res.json({ message: `Application ${status} successfully.` });
  } catch (err) {
    console.error('Update application error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/admin/users
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ users });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/admin/orders
router.get('/orders', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    let query = `SELECT o.*, u.name as user_name, u.email as user_email FROM orders o JOIN users u ON o.user_id = u.id`;
    const values = [];

    if (status && status !== 'all') {
      query += ' WHERE o.status = ?';
      values.push(status);
    }
    query += ' ORDER BY o.created_at DESC';

    const [orders] = await db.query(query, values);
    for (let order of orders) {
      const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      order.items = items;

      // Get business names for seller identification
      const [businessNames] = await db.query(
        `SELECT DISTINCT sa.business_name
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         JOIN seller_applications sa ON p.seller_id = sa.user_id AND sa.status = 'approved'
         WHERE oi.order_id = ?`,
        [order.id]
      );
      order.business_names = businessNames.map(b => b.business_name).filter(Boolean);
    }
    res.json({ orders });
  } catch (err) {
    console.error('Get admin orders error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
