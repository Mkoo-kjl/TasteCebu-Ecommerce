const express = require('express');
const db = require('../db');
const { requireAuth, requireSeller } = require('../middleware/auth');

const router = express.Router();

// Allowed image MIME prefixes
const ALLOWED_IMAGE_PREFIXES = ['data:image/png', 'data:image/jpeg'];

function isValidImageDataUri(dataUri) {
  if (!dataUri) return true;
  return ALLOWED_IMAGE_PREFIXES.some(prefix => dataUri.startsWith(prefix));
}

function validateImages(images) {
  for (let i = 0; i < images.length; i++) {
    if (!isValidImageDataUri(images[i])) {
      return false;
    }
  }
  return true;
}

// POST /api/seller/apply - Submit seller application
router.post('/apply', requireAuth, async (req, res) => {
  try {
    const { business_name, business_description, business_address, business_phone, agreed_to_terms, subscription_plan } = req.body;

    if (!business_name || !business_description || !business_address || !business_phone) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (!agreed_to_terms) {
      return res.status(400).json({ message: 'You must agree to the Terms and Conditions.' });
    }

    // Check if user already has a pending/approved application
    const [existing] = await db.query(
      'SELECT id, status FROM seller_applications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );

    if (existing.length > 0) {
      if (existing[0].status === 'pending') {
        return res.status(400).json({ message: 'You already have a pending application.' });
      }
      if (existing[0].status === 'approved') {
        return res.status(400).json({ message: 'You are already an approved seller.' });
      }
    }

    // Check if user is already a seller
    if (req.user.role === 'seller') {
      return res.status(400).json({ message: 'You are already a seller.' });
    }

    // Try inserting with agreed_to_terms column first, fallback without it
    // Try inserting with subscription_plan and agreed_to_terms
    try {
      await db.query(
        `INSERT INTO seller_applications (user_id, business_name, business_description, business_address, business_phone, agreed_to_terms, subscription_plan)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, business_name.trim(), business_description.trim(), business_address.trim(), business_phone.trim(), 1, subscription_plan || 'basic']
      );
    } catch (insertErr) {
      if (insertErr.code === 'ER_BAD_FIELD_ERROR') {
        console.warn('Columns missing, inserting without them. Run schema update.');
        await db.query(
          `INSERT INTO seller_applications (user_id, business_name, business_description, business_address, business_phone)
           VALUES (?, ?, ?, ?, ?)`,
          [req.user.id, business_name.trim(), business_description.trim(), business_address.trim(), business_phone.trim()]
        );
      } else {
        throw insertErr;
      }
    }

    res.status(201).json({ message: 'Seller application submitted successfully! Please wait for admin approval.' });
  } catch (err) {
    console.error('Seller apply error:', err.message, err.code, err.sqlMessage || '');
    res.status(500).json({ message: 'Server error: ' + (err.sqlMessage || err.message) });
  }
});

// GET /api/seller/application-status
router.get('/application-status', requireAuth, async (req, res) => {
  try {
    const [applications] = await db.query(
      'SELECT id, business_name, status, subscription_plan, admin_notes, created_at, updated_at FROM seller_applications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );

    if (applications.length === 0) {
      return res.json({ application: null });
    }

    res.json({ application: applications[0] });
  } catch (err) {
    console.error('Get application status error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/seller/products - Get seller's own products
router.get('/products', requireAuth, requireSeller, async (req, res) => {
  try {
    const [products] = await db.query(
      'SELECT * FROM products WHERE seller_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ products });
  } catch (err) {
    console.error('Get seller products error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/seller/products - Create product (supports up to 10 images)
router.post('/products', requireAuth, requireSeller, async (req, res) => {
  try {
    const { name, description, price, stock, image, images, category } = req.body;

    if (!name || !description || price === undefined || stock === undefined) {
      return res.status(400).json({ message: 'Name, description, price, and stock are required.' });
    }
    if (price < 0) {
      return res.status(400).json({ message: 'Price must be a positive number.' });
    }
    if (stock < 0) {
      return res.status(400).json({ message: 'Stock must be a non-negative number.' });
    }

    // Check plan limits
    const [applications] = await db.query(
      'SELECT subscription_plan FROM seller_applications WHERE user_id = ? AND status = "approved"',
      [req.user.id]
    );
    const plan = applications.length > 0 ? applications[0].subscription_plan : 'basic';
    
    if (plan === 'basic') {
      const [countResult] = await db.query('SELECT COUNT(*) as count FROM products WHERE seller_id = ?', [req.user.id]);
      if (countResult[0].count >= 50) {
        return res.status(403).json({ message: 'Basic plan is limited to 50 products. Please upgrade to add more.' });
      }
    }

    // Support both legacy single image and new multi-image array
    let imageData = null;
    if (images && Array.isArray(images)) {
      if (images.length > 10) {
        return res.status(400).json({ message: 'Maximum 10 images allowed.' });
      }
      if (!validateImages(images)) {
        return res.status(400).json({ message: 'Only PNG and JPEG images are allowed.' });
      }
      imageData = JSON.stringify(images);
    } else if (image) {
      if (!isValidImageDataUri(image)) {
        return res.status(400).json({ message: 'Only PNG and JPEG images are allowed.' });
      }
      imageData = JSON.stringify([image]);
    }

    // FIX: Added is_active = 1 so new products are visible on the public Products page
    const [result] = await db.query(
      `INSERT INTO products (seller_id, name, description, price, stock, image, category, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [req.user.id, name.trim(), description.trim(), price, stock, imageData, category || 'General']
    );

    const [products] = await db.query('SELECT * FROM products WHERE id = ?', [result.insertId]);

    res.status(201).json({ message: 'Product created successfully.', product: products[0] });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/seller/products/:id - Update product (supports up to 10 images)
router.put('/products/:id', requireAuth, requireSeller, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, image, images, category, is_active } = req.body;

    // Verify ownership
    const [existing] = await db.query('SELECT id FROM products WHERE id = ? AND seller_id = ?', [id, req.user.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Product not found or you do not own it.' });
    }

    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name.trim()); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description.trim()); }
    if (price !== undefined) { updates.push('price = ?'); values.push(price); }
    if (stock !== undefined) { updates.push('stock = ?'); values.push(stock); }
    if (images !== undefined && Array.isArray(images)) {
      if (images.length > 10) {
        return res.status(400).json({ message: 'Maximum 10 images allowed.' });
      }
      if (!validateImages(images)) {
        return res.status(400).json({ message: 'Only PNG and JPEG images are allowed.' });
      }
      updates.push('image = ?');
      values.push(JSON.stringify(images));
    } else if (image !== undefined) {
      if (image && !isValidImageDataUri(image)) {
        return res.status(400).json({ message: 'Only PNG and JPEG images are allowed.' });
      }
      updates.push('image = ?');
      values.push(image ? JSON.stringify([image]) : null);
    }
    if (category !== undefined) { updates.push('category = ?'); values.push(category); }
    if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active ? 1 : 0); }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update.' });
    }

    values.push(id);
    await db.query(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, values);

    const [products] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    res.json({ message: 'Product updated successfully.', product: products[0] });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/seller/products/:id - Delete product
router.delete('/products/:id', requireAuth, requireSeller, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const [existing] = await db.query('SELECT id FROM products WHERE id = ? AND seller_id = ?', [id, req.user.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Product not found or you do not own it.' });
    }

    await db.query('DELETE FROM products WHERE id = ?', [id]);

    res.json({ message: 'Product deleted successfully.' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// =============================================
// SELLER ORDER MANAGEMENT
// =============================================

// GET /api/seller/orders - Get orders containing seller's products
router.get('/orders', requireAuth, requireSeller, async (req, res) => {
  try {
    const { status } = req.query;

    // Find orders that contain at least one product from this seller
    let query = `
      SELECT DISTINCT o.*, u.name as customer_name, u.email as customer_email
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      JOIN users u ON o.user_id = u.id
      WHERE p.seller_id = ?
    `;
    const values = [req.user.id];

    if (status && status !== 'all') {
      query += ' AND o.status = ?';
      values.push(status);
    }
    query += ' ORDER BY o.created_at DESC';

    const [orders] = await db.query(query, values);

    // Get items for each order (only this seller's items)
    for (let order of orders) {
      const [items] = await db.query(
        `SELECT oi.* FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ? AND p.seller_id = ?`,
        [order.id, req.user.id]
      );
      order.items = items;
      // Recalculate total for just this seller's items
      order.seller_total = items.reduce((sum, item) => sum + (item.product_price * item.quantity), 0);
    }

    res.json({ orders });
  } catch (err) {
    console.error('Get seller orders error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/seller/orders/:id/status - Seller updates order status
router.put('/orders/:id/status', requireAuth, requireSeller, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    // Verify this order contains products from this seller
    const [check] = await db.query(
      `SELECT DISTINCT o.id, o.status FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       WHERE o.id = ? AND p.seller_id = ?`,
      [req.params.id, req.user.id]
    );
    if (check.length === 0) {
      return res.status(404).json({ message: 'Order not found or does not contain your products.' });
    }

    // If cancelling, restore stock for this seller's items only
    if (status === 'cancelled' && check[0].status !== 'cancelled') {
      const [items] = await db.query(
        `SELECT oi.product_id, oi.quantity FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ? AND p.seller_id = ?`,
        [req.params.id, req.user.id]
      );
      for (const item of items) {
        if (item.product_id) {
          await db.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
        }
      }
    }

    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: `Order status updated to ${status}.` });
  } catch (err) {
    console.error('Seller update order status error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// =============================================
// SELLER ANALYTICS
// =============================================

// GET /api/seller/analytics - Get seller analytics data
router.get('/analytics', requireAuth, requireSeller, async (req, res) => {
  try {
    const sellerId = req.user.id;

    // Check plan limits
    const [applications] = await db.query(
      'SELECT subscription_plan FROM seller_applications WHERE user_id = ? AND status = "approved"',
      [sellerId]
    );
    const plan = applications.length > 0 ? applications[0].subscription_plan : 'basic';

    if (plan === 'basic') {
      return res.status(403).json({ message: 'Analytics are not available on the Basic plan. Please upgrade your subscription.' });
    }

    // Total revenue from delivered orders
    const [revenueResult] = await db.query(
      `SELECT
         COALESCE(SUM(oi.product_price * oi.quantity), 0) as total_revenue,
         COALESCE(SUM(oi.quantity), 0) as total_units_sold,
         COUNT(DISTINCT o.id) as total_orders
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN orders o ON oi.order_id = o.id
       WHERE p.seller_id = ? AND o.status = 'delivered'`,
      [sellerId]
    );

    // Average seller rating from product reviews
    const [ratingResult] = await db.query(
      `SELECT
         COUNT(*) as total_reviews,
         COALESCE(AVG(pr.rating), 0) as avg_rating
       FROM product_reviews pr
       JOIN products p ON pr.product_id = p.id
       WHERE p.seller_id = ?`,
      [sellerId]
    );

    // Per-product breakdown
    const [productStats] = await db.query(
      `SELECT
         p.id,
         p.name,
         p.image,
         COALESCE(sales.units_sold, 0) as units_sold,
         COALESCE(sales.revenue, 0) as revenue,
         COALESCE(reviews.avg_rating, 0) as avg_rating,
         COALESCE(reviews.review_count, 0) as review_count
       FROM products p
       LEFT JOIN (
         SELECT oi.product_id,
                SUM(oi.quantity) as units_sold,
                SUM(oi.product_price * oi.quantity) as revenue
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         WHERE o.status = 'delivered'
         GROUP BY oi.product_id
       ) sales ON p.id = sales.product_id
       LEFT JOIN (
         SELECT product_id,
                AVG(rating) as avg_rating,
                COUNT(*) as review_count
         FROM product_reviews
         GROUP BY product_id
       ) reviews ON p.id = reviews.product_id
       WHERE p.seller_id = ?
       ORDER BY COALESCE(sales.revenue, 0) DESC`,
      [sellerId]
    );

    // Order status breakdown
    const [statusBreakdown] = await db.query(
      `SELECT o.status, COUNT(DISTINCT o.id) as count
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       WHERE p.seller_id = ?
       GROUP BY o.status`,
      [sellerId]
    );

    // Monthly Revenue over last 6 months
    const [monthlyRevenue] = await db.query(`
      SELECT 
        DATE_FORMAT(o.created_at, '%Y-%m') as month_raw,
        DATE_FORMAT(o.created_at, '%b %Y') as month, 
        SUM(oi.product_price * oi.quantity) as revenue 
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE p.seller_id = ? AND o.status = 'delivered' AND o.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month_raw, month 
      ORDER BY month_raw ASC
    `, [sellerId]);

    res.json({
      summary: {
        totalRevenue: Number(revenueResult[0].total_revenue),
        totalUnitsSold: Number(revenueResult[0].total_units_sold),
        totalOrders: Number(revenueResult[0].total_orders),
        totalReviews: Number(ratingResult[0].total_reviews),
        avgRating: Number(Number(ratingResult[0].avg_rating).toFixed(1)),
      },
      productStats,
      statusBreakdown,
      monthlyRevenue,
    });
  } catch (err) {
    console.error('Get seller analytics error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// =============================================
// SELLER SUBSCRIPTION UPGRADE
// =============================================

// PUT /api/seller/upgrade - Upgrade seller subscription plan
router.put('/upgrade', requireAuth, requireSeller, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!['pro', 'enterprise'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan selected.' });
    }

    const [applications] = await db.query(
      'SELECT id, subscription_plan FROM seller_applications WHERE user_id = ? AND status = "approved"',
      [req.user.id]
    );

    if (applications.length === 0) {
      return res.status(404).json({ message: 'Approved seller application not found.' });
    }

    if (applications[0].subscription_plan === plan) {
      return res.status(400).json({ message: 'You are already on this plan.' });
    }

    await db.query(
      'UPDATE seller_applications SET subscription_plan = ? WHERE id = ?',
      [plan, applications[0].id]
    );

    res.json({ message: 'Subscription upgraded successfully!', plan });
  } catch (err) {
    console.error('Upgrade subscription error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/seller/terminate - Terminate own seller subscription
router.post('/terminate', requireAuth, requireSeller, async (req, res) => {
  try {
    const sellerId = req.user.id;
    // Update applications to rejected
    await db.query("UPDATE seller_applications SET status = 'terminated', admin_notes = 'Terminated by seller' WHERE user_id = ?", [sellerId]);
    // Update user role to user
    await db.query("UPDATE users SET role = 'user' WHERE id = ?", [sellerId]);
    // Deactivate products
    await db.query("UPDATE products SET is_active = 0 WHERE seller_id = ?", [sellerId]);
    
    res.json({ message: 'Subscription terminated successfully.' });
  } catch (err) {
    console.error('Terminate subscription error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;