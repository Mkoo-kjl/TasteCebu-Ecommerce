const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    let query = `SELECT p.*, u.name as seller_name,
                   COALESCE(rv.review_count, 0) as review_count,
                   COALESCE(rv.avg_rating, 0) as avg_rating
                 FROM products p
                 JOIN users u ON p.seller_id = u.id
                 LEFT JOIN (
                   SELECT product_id, COUNT(*) as review_count, AVG(rating) as avg_rating
                   FROM product_reviews GROUP BY product_id
                 ) rv ON p.id = rv.product_id
                 WHERE p.is_active = 1`;
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

// GET /api/products/seller/:sellerId - Public seller profile
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const sellerId = req.params.sellerId;

    // Get seller user info
    const [users] = await db.query(
      'SELECT id, name, avatar, created_at FROM users WHERE id = ? AND role = ?',
      [sellerId, 'seller']
    );
    if (users.length === 0) {
      return res.status(404).json({ message: 'Seller not found.' });
    }

    // Get business info
    const [apps] = await db.query(
      `SELECT business_name, business_description, business_address, business_phone, subscription_plan, created_at as shop_since
       FROM seller_applications WHERE user_id = ? AND status = 'approved'`,
      [sellerId]
    );

    // Get aggregate rating from all product reviews
    const [ratingResult] = await db.query(
      `SELECT COUNT(*) as total_reviews, COALESCE(AVG(pr.rating), 0) as avg_rating
       FROM product_reviews pr
       JOIN products p ON pr.product_id = p.id
       WHERE p.seller_id = ?`,
      [sellerId]
    );

    // Get total products and total sold
    const [[{ total_products }]] = await db.query(
      'SELECT COUNT(*) as total_products FROM products WHERE seller_id = ? AND is_active = 1',
      [sellerId]
    );
    const [[{ total_sold }]] = await db.query(
      `SELECT COALESCE(SUM(oi.quantity), 0) as total_sold
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN orders o ON oi.order_id = o.id
       WHERE p.seller_id = ? AND o.status = 'delivered'`,
      [sellerId]
    );

    // Get seller's active products with reviews
    const [products] = await db.query(
      `SELECT p.*, u.name as seller_name,
              COALESCE(rv.review_count, 0) as review_count,
              COALESCE(rv.avg_rating, 0) as avg_rating
       FROM products p
       JOIN users u ON p.seller_id = u.id
       LEFT JOIN (
         SELECT product_id, COUNT(*) as review_count, AVG(rating) as avg_rating
         FROM product_reviews GROUP BY product_id
       ) rv ON p.id = rv.product_id
       WHERE p.seller_id = ? AND p.is_active = 1
       ORDER BY p.created_at DESC`,
      [sellerId]
    );

    res.json({
      seller: {
        ...users[0],
        business: apps[0] || null,
        stats: {
          total_reviews: ratingResult[0].total_reviews,
          avg_rating: Number(Number(ratingResult[0].avg_rating).toFixed(1)),
          total_products,
          total_sold: Number(total_sold)
        }
      },
      products
    });
  } catch (err) {
    console.error('Get seller profile error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const [products] = await db.query(
      `SELECT p.*, u.name as seller_name,
              COALESCE(rv.review_count, 0) as review_count,
              COALESCE(rv.avg_rating, 0) as avg_rating
       FROM products p
       JOIN users u ON p.seller_id = u.id
       LEFT JOIN (
         SELECT product_id, COUNT(*) as review_count, AVG(rating) as avg_rating
         FROM product_reviews GROUP BY product_id
       ) rv ON p.id = rv.product_id
       WHERE p.id = ?`,
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
