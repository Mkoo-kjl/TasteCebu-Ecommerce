const express = require('express');
const db = require('../db');
const { requireAuth, requireSeller } = require('../middleware/auth');

const router = express.Router();

// POST /api/seller/apply - Submit seller application
router.post('/apply', requireAuth, async (req, res) => {
  try {
    const { business_name, business_description, business_address, business_phone } = req.body;

    if (!business_name || !business_description || !business_address || !business_phone) {
      return res.status(400).json({ message: 'All fields are required.' });
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

    await db.query(
      `INSERT INTO seller_applications (user_id, business_name, business_description, business_address, business_phone)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, business_name.trim(), business_description.trim(), business_address.trim(), business_phone.trim()]
    );

    res.status(201).json({ message: 'Seller application submitted successfully! Please wait for admin approval.' });
  } catch (err) {
    console.error('Seller apply error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/seller/application-status
router.get('/application-status', requireAuth, async (req, res) => {
  try {
    const [applications] = await db.query(
      'SELECT id, business_name, status, admin_notes, created_at, updated_at FROM seller_applications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
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

    // Support both legacy single image and new multi-image array
    let imageData = null;
    if (images && Array.isArray(images)) {
      if (images.length > 10) {
        return res.status(400).json({ message: 'Maximum 10 images allowed.' });
      }
      imageData = JSON.stringify(images);
    } else if (image) {
      imageData = JSON.stringify([image]);
    }

    const [result] = await db.query(
      `INSERT INTO products (seller_id, name, description, price, stock, image, category)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
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
      updates.push('image = ?');
      values.push(JSON.stringify(images));
    } else if (image !== undefined) {
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

module.exports = router;

