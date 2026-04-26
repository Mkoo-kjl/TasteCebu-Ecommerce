const express = require('express');
const db = require('../db');
const { requireAuth, requireCustomer } = require('../middleware/auth');

const router = express.Router();

// POST /api/orders - Place order from cart (customers only)
router.post('/', requireAuth, requireCustomer, async (req, res) => {
  try {
    const { shipping_address, cart_item_ids } = req.body;
    if (!shipping_address) return res.status(400).json({ message: 'Shipping address is required.' });

    // Get cart items - optionally filtered by selected IDs
    let cartQuery = `SELECT ci.id, ci.quantity, p.id as product_id, p.name, p.price, p.image, p.stock
       FROM cart_items ci JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = ? AND p.is_active = 1`;
    const queryParams = [req.user.id];

    if (cart_item_ids && Array.isArray(cart_item_ids) && cart_item_ids.length > 0) {
      cartQuery += ` AND ci.id IN (${cart_item_ids.map(() => '?').join(',')})`;
      queryParams.push(...cart_item_ids);
    }

    const [cartItems] = await db.query(cartQuery, queryParams);

    if (cartItems.length === 0) return res.status(400).json({ message: 'No valid items selected for checkout.' });

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

    // Remove only the checked-out items from cart (not the entire cart)
    const checkedOutIds = cartItems.map(i => i.id);
    await db.query(`DELETE FROM cart_items WHERE id IN (${checkedOutIds.map(() => '?').join(',')}) AND user_id = ?`, [...checkedOutIds, req.user.id]);

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

// GET /api/orders/:id/receipt - Get receipt for a delivered order (customer or seller)
// NOTE: This route MUST come before /:id to avoid Express matching 'receipt' as an ID
router.get('/:id/receipt', requireAuth, async (req, res) => {
  try {
    const orderId = req.params.id;

    // Get order details
    const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) return res.status(404).json({ message: 'Order not found.' });
    const order = orders[0];

    // Only allow receipt for delivered orders
    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Receipt is only available for delivered orders.' });
    }

    // Get order items with seller info
    const [items] = await db.query(
      `SELECT oi.*, p.seller_id
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    // Check access: either the customer or a seller with products in this order
    const isCustomer = order.user_id === req.user.id;
    const sellerIds = [...new Set(items.map(i => i.seller_id).filter(Boolean))];
    const isSeller = sellerIds.includes(req.user.id);
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isSeller && !isAdmin) {
      return res.status(403).json({ message: 'You do not have access to this receipt.' });
    }

    // Get customer info
    const [customers] = await db.query('SELECT name, email, phone FROM users WHERE id = ?', [order.user_id]);
    const customer = customers[0] || {};

    // Get seller/shop info for each unique seller
    const shops = [];
    for (const sellerId of sellerIds) {
      const [sellerInfo] = await db.query(
        `SELECT u.name as seller_name, sa.business_name, sa.business_address, sa.business_phone
         FROM users u
         LEFT JOIN seller_applications sa ON u.id = sa.user_id AND sa.status = 'approved'
         WHERE u.id = ?`,
        [sellerId]
      );
      if (sellerInfo.length > 0) shops.push(sellerInfo[0]);
    }

    // If seller is viewing, only show their items
    let receiptItems = items;
    if (isSeller && !isCustomer && !isAdmin) {
      receiptItems = items.filter(i => i.seller_id === req.user.id);
    }

    const receiptTotal = receiptItems.reduce((sum, item) => sum + (item.product_price * item.quantity), 0);

    res.json({
      receipt: {
        order_id: order.id,
        order_date: order.created_at,
        delivery_date: order.updated_at,
        status: order.status,
        shipping_address: order.shipping_address,
        total_amount: isCustomer || isAdmin ? Number(order.total_amount) : receiptTotal,
        customer: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
        },
        shops,
        items: receiptItems.map(item => ({
          id: item.id,
          product_name: item.product_name,
          product_price: Number(item.product_price),
          product_image: item.product_image,
          quantity: item.quantity,
          subtotal: Number(item.product_price) * item.quantity,
        })),
      }
    });
  } catch (err) {
    console.error('Get receipt error:', err);
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

// PUT /api/orders/:id/cancel (customers only)
router.put('/:id/cancel', requireAuth, requireCustomer, async (req, res) => {
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
