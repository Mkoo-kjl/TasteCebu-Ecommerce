const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/analytics
router.get('/analytics', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [[{ total_users }]] = await db.query('SELECT COUNT(*) as total_users FROM users');
    const [[{ total_sellers }]] = await db.query('SELECT COUNT(*) as total_sellers FROM users WHERE role = ?', ['seller']);
    const [[{ total_shops }]] = await db.query('SELECT COUNT(*) as total_shops FROM seller_applications WHERE status = ?', ['approved']);
    const [[{ total_applicants }]] = await db.query("SELECT COUNT(*) as total_applicants FROM seller_applications");
    const [[{ terminated_count }]] = await db.query("SELECT COUNT(*) as terminated_count FROM seller_applications WHERE status = 'terminated'");

    // Calculate Monthly Recurring Revenue (MRR) from active seller subscriptions
    // Basic: ₱0, Pro: ₱499, Enterprise: ₱999
    const [[{ total_revenue }]] = await db.query(`
      SELECT SUM(
        CASE 
          WHEN subscription_plan = 'pro' THEN 499 
          WHEN subscription_plan = 'enterprise' THEN 999 
          ELSE 0 
        END
      ) as total_revenue 
      FROM seller_applications 
      WHERE status = 'approved'
    `);
    
    // Seller applicants over time (last 30 days)
    const [applicants_by_date] = await db.query(`
      SELECT DATE(created_at) as date, COUNT(id) as count 
      FROM seller_applications 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at) 
      ORDER BY date ASC
    `);

    // User registrations over last 30 days
    const [users_by_date] = await db.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at) 
      ORDER BY date ASC
    `);

    // Seller applications breakdown by status
    const [applications_by_status] = await db.query(`
      SELECT status, COUNT(*) as count 
      FROM seller_applications 
      GROUP BY status
    `);

    // Subscriptions by plan
    const [subscriptions_by_plan] = await db.query('SELECT subscription_plan, COUNT(*) as count FROM seller_applications WHERE status = "approved" GROUP BY subscription_plan');

    // Top selling products across the platform
    const [top_selling_products] = await db.query(`
      SELECT p.name, SUM(oi.quantity) as total_sold, SUM(oi.product_price * oi.quantity) as revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'delivered'
      GROUP BY p.id, p.name
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    // Monthly Subscription Revenue over last 6 months
    const [monthly_revenue] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month_raw,
        DATE_FORMAT(created_at, '%b %Y') as month, 
        SUM(
          CASE 
            WHEN subscription_plan = 'pro' THEN 499 
            WHEN subscription_plan = 'enterprise' THEN 999 
            ELSE 0 
          END
        ) as revenue 
      FROM seller_applications 
      WHERE status = 'approved' AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month_raw, month 
      ORDER BY month_raw ASC
    `);

    res.json({ 
      analytics: { 
        total_users, 
        total_sellers, 
        total_shops,
        total_applicants,
        terminated_count,
        total_revenue: total_revenue || 0,
        monthly_revenue,
        applicants_by_date,
        users_by_date,
        applications_by_status,
        subscriptions_by_plan,
        top_selling_products
      } 
    });
  } catch (err) {
    console.error('Get analytics error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/admin/analytics/export - Export admin analytics for Excel
router.get('/analytics/export', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [[{ total_users }]] = await db.query('SELECT COUNT(*) as total_users FROM users');
    const [[{ total_sellers }]] = await db.query('SELECT COUNT(*) as total_sellers FROM users WHERE role = ?', ['seller']);
    const [[{ total_shops }]] = await db.query('SELECT COUNT(*) as total_shops FROM seller_applications WHERE status = ?', ['approved']);
    const [[{ total_applicants }]] = await db.query("SELECT COUNT(*) as total_applicants FROM seller_applications");
    const [[{ terminated_count }]] = await db.query("SELECT COUNT(*) as terminated_count FROM seller_applications WHERE status = 'terminated'");
    const [[{ total_revenue }]] = await db.query(`
      SELECT SUM(CASE WHEN subscription_plan = 'pro' THEN 499 WHEN subscription_plan = 'enterprise' THEN 999 ELSE 0 END) as total_revenue
      FROM seller_applications WHERE status = 'approved'
    `);

    const [users_by_date] = await db.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY DATE(created_at) ORDER BY date ASC
    `);

    const [monthly_revenue] = await db.query(`
      SELECT DATE_FORMAT(created_at, '%b %Y') as month,
        SUM(CASE WHEN subscription_plan = 'pro' THEN 499 WHEN subscription_plan = 'enterprise' THEN 999 ELSE 0 END) as revenue
      FROM seller_applications WHERE status = 'approved' AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m'), month ORDER BY DATE_FORMAT(created_at, '%Y-%m') ASC
    `);

    const [applications_by_status] = await db.query(`SELECT status, COUNT(*) as count FROM seller_applications GROUP BY status`);
    const [subscriptions_by_plan] = await db.query('SELECT subscription_plan, COUNT(*) as count FROM seller_applications WHERE status = "approved" GROUP BY subscription_plan');

    // Seller applicants over time (last 30 days) - matches the Seller Applications Trend chart
    const [applicants_by_date] = await db.query(`
      SELECT DATE(created_at) as date, COUNT(id) as count 
      FROM seller_applications 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at) ORDER BY date ASC
    `);

    const [top_selling_products] = await db.query(`
      SELECT p.name, SUM(oi.quantity) as total_sold, SUM(oi.product_price * oi.quantity) as revenue
      FROM order_items oi JOIN products p ON oi.product_id = p.id JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'delivered' GROUP BY p.id, p.name ORDER BY total_sold DESC LIMIT 10
    `);

    // All users list for export
    const [allUsers] = await db.query('SELECT name, email, phone, role, created_at FROM users ORDER BY created_at DESC');

    res.json({
      summary: { total_users, total_sellers, total_shops, total_applicants, terminated_count, total_revenue: total_revenue || 0 },
      users_by_date: users_by_date.map(d => ({ date: d.date, count: d.count })),
      monthly_revenue: monthly_revenue.map(r => ({ month: r.month, revenue: Number(r.revenue) })),
      applications_by_status,
      subscriptions_by_plan,
      applicants_by_date: applicants_by_date.map(d => ({ date: d.date, count: d.count })),
      top_selling_products: top_selling_products.map(p => ({ name: p.name, total_sold: Number(p.total_sold), revenue: Number(p.revenue) })),
      allUsers: allUsers.map(u => ({ name: u.name, email: u.email, phone: u.phone || '', role: u.role, joined: u.created_at }))
    });
  } catch (err) {
    console.error('Export admin analytics error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

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
    if (!status || !['approved', 'rejected', 'terminated'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved, rejected, or terminated.' });
    }

    const [apps] = await db.query('SELECT * FROM seller_applications WHERE id = ?', [req.params.id]);
    if (apps.length === 0) return res.status(404).json({ message: 'Application not found.' });

    await db.query('UPDATE seller_applications SET status = ?, admin_notes = ? WHERE id = ?',
      [status, admin_notes || null, req.params.id]);

    // If approved, update user role to seller
    if (status === 'approved') {
      await db.query('UPDATE users SET role = ? WHERE id = ?', ['seller', apps[0].user_id]);
    } else if (status === 'rejected' || status === 'terminated') {
      await db.query('UPDATE users SET role = ? WHERE id = ?', ['user', apps[0].user_id]);
      await db.query('UPDATE products SET is_active = 0 WHERE seller_id = ?', [apps[0].user_id]);
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
