const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    let query = `SELECT p.*, u.name as seller_name FROM products p JOIN users u ON p.seller_id = u.id WHERE p.is_active = 1`;
    const values = [];

    if (category && category !== 'All') {
      query += ' AND p.category = ?';
      values.push(category);
    }
    if (search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      values.push(`%${search}%`, `%${search}%`);
    }

    switch (sort) {
      case 'price_asc': query += ' ORDER BY p.price ASC'; break;
      case 'price_desc': query += ' ORDER BY p.price DESC'; break;
      case 'name_asc': query += ' ORDER BY p.name ASC'; break;
      default: query += ' ORDER BY p.created_at DESC';
    }

    const [products] = await db.query(query, values);
    const [categories] = await db.query('SELECT DISTINCT category FROM products WHERE is_active = 1 ORDER BY category');
    res.json({ products, categories: categories.map(c => c.category) });
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const [products] = await db.query(
      `SELECT p.*, u.name as seller_name FROM products p JOIN users u ON p.seller_id = u.id WHERE p.id = ?`,
      [req.params.id]
    );
    if (products.length === 0) return res.status(404).json({ message: 'Product not found.' });
    res.json({ product: products[0] });
  } catch (err) {
    console.error('Get product error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
