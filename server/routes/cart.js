const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/cart
router.get('/', requireAuth, async (req, res) => {
  try {
    const [items] = await db.query(
      `SELECT ci.id, ci.quantity, p.id as product_id, p.name, p.price, p.image, p.stock, p.is_active, u.name as seller_name
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       JOIN users u ON p.seller_id = u.id
       WHERE ci.user_id = ?
       ORDER BY ci.created_at DESC`,
      [req.user.id]
    );
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    res.json({ items, total });
  } catch (err) {
    console.error('Get cart error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/cart
router.post('/', requireAuth, async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    if (!product_id || !quantity || quantity < 1) {
      return res.status(400).json({ message: 'Product ID and valid quantity required.' });
    }

    // Check product exists and is active
    const [products] = await db.query('SELECT id, stock FROM products WHERE id = ? AND is_active = 1', [product_id]);
    if (products.length === 0) return res.status(404).json({ message: 'Product not found.' });
    if (products[0].stock < quantity) return res.status(400).json({ message: 'Not enough stock.' });

    // Upsert cart item
    const [existing] = await db.query('SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?', [req.user.id, product_id]);
    if (existing.length > 0) {
      const newQty = existing[0].quantity + quantity;
      if (newQty > products[0].stock) return res.status(400).json({ message: 'Not enough stock.' });
      await db.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing[0].id]);
    } else {
      await db.query('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)', [req.user.id, product_id, quantity]);
    }

    res.status(201).json({ message: 'Item added to cart.' });
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/cart/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) return res.status(400).json({ message: 'Valid quantity required.' });

    const [items] = await db.query(
      'SELECT ci.id, p.stock FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.id = ? AND ci.user_id = ?',
      [req.params.id, req.user.id]
    );
    if (items.length === 0) return res.status(404).json({ message: 'Cart item not found.' });
    if (quantity > items[0].stock) return res.status(400).json({ message: 'Not enough stock.' });

    await db.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, req.params.id]);
    res.json({ message: 'Cart updated.' });
  } catch (err) {
    console.error('Update cart error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/cart/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const [items] = await db.query('SELECT id FROM cart_items WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (items.length === 0) return res.status(404).json({ message: 'Cart item not found.' });
    await db.query('DELETE FROM cart_items WHERE id = ?', [req.params.id]);
    res.json({ message: 'Item removed from cart.' });
  } catch (err) {
    console.error('Delete cart item error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
