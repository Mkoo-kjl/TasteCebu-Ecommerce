const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/orders - Place order from cart
router.post('/', requireAuth, async (req, res) => {
  try {
    const { shipping_address } = req.body;
    if (!shipping_address) return res.status(400).json({ message: 'Shipping address is required.' });

    // Get cart items
    const [cartItems] = await db.query(
      `SELECT ci.id, ci.quantity, p.id as product_id, p.name, p.price, p.image, p.stock
       FROM cart_items ci JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = ? AND p.is_active = 1`,
      [req.user.id]
    );

    if (cartItems.length === 0) return res.status(400).json({ message: 'Your cart is empty.' });

    // Validate stock
    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        return res.status(400).json({ message: `Not enough stock for "${item.name}". Available: ${item.stock}` });
      }
    }

    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create order
    const [orderResult] = await db.query(
      'INSERT INTO orders (user_id, total_amount, status, shipping_address) VALUES (?, ?, ?, ?)',
      [req.user.id, total, 'pending', shipping_address]
    );
    const orderId = orderResult.insertId;

    // Create order items and update stock
    for (const item of cartItems) {
      await db.query(
        'INSERT INTO order_items (order_id, product_id, product_name, product_price, product_image, quantity) VALUES (?, ?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.name, item.price, item.image, item.quantity]
      );
      await db.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    // Clear cart
    await db.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);

    res.status(201).json({ message: 'Order placed successfully!', order_id: orderId });
  } catch (err) {
    console.error('Place order error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/orders
router.get('/', requireAuth, async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM orders WHERE user_id = ?';
    const values = [req.user.id];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      values.push(status);
    }
    query += ' ORDER BY created_at DESC';

    const [orders] = await db.query(query, values);

    // Get items for each order
    for (let order of orders) {
      const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      order.items = items;
    }

    res.json({ orders });
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/orders/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const [orders] = await db.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (orders.length === 0) return res.status(404).json({ message: 'Order not found.' });

    const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [orders[0].id]);
    orders[0].items = items;

    res.json({ order: orders[0] });
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/orders/:id/cancel
router.put('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const [orders] = await db.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (orders.length === 0) return res.status(404).json({ message: 'Order not found.' });
    if (orders[0].status !== 'pending') return res.status(400).json({ message: 'Only pending orders can be cancelled.' });

    // Restore stock
    const [items] = await db.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orders[0].id]);
    for (const item of items) {
      if (item.product_id) {
        await db.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
      }
    }

    await db.query('UPDATE orders SET status = ? WHERE id = ?', ['cancelled', req.params.id]);
    res.json({ message: 'Order cancelled successfully.' });
  } catch (err) {
    console.error('Cancel order error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
