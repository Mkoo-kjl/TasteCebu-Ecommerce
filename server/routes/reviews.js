const express = require('express');
const db = require('../db');
const { requireAuth, requireCustomer } = require('../middleware/auth');

const router = express.Router();

// Allowed image MIME prefixes for review photos
const ALLOWED_IMAGE_PREFIXES = ['data:image/png', 'data:image/jpeg'];

function isValidImageDataUri(dataUri) {
  if (!dataUri) return true; // optional
  return ALLOWED_IMAGE_PREFIXES.some(prefix => dataUri.startsWith(prefix));
}

// GET /api/reviews/product/:productId - Get all reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const [reviews] = await db.query(
      `SELECT pr.*, u.name as reviewer_name, u.avatar as reviewer_avatar
       FROM product_reviews pr
       JOIN users u ON pr.user_id = u.id
       WHERE pr.product_id = ?
       ORDER BY pr.created_at DESC`,
      [productId]
    );

    // Calculate aggregate stats
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : 0;

    res.json({ reviews, totalReviews, avgRating: Number(avgRating) });
  } catch (err) {
    console.error('Get product reviews error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/reviews/can-review/:productId - Check if user can review this product
router.get('/can-review/:productId', requireAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    // Only customers can review
    if (req.user.role !== 'user') {
      return res.json({ canReview: false, reason: 'Only customers can write reviews.', eligibleOrders: [] });
    }

    // Find delivered orders containing this product
    const [eligibleOrders] = await db.query(
      `SELECT o.id as order_id, o.created_at as order_date, oi.product_name
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'delivered'`,
      [userId, productId]
    );

    res.json({
      canReview: eligibleOrders.length > 0,
      reason: eligibleOrders.length > 0 ? null : 'You need a delivered order of this product to leave a review.',
      eligibleOrders,
    });
  } catch (err) {
    console.error('Can review check error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/reviews/product/:productId - Submit a product review
router.post('/product/:productId', requireAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;
    const { order_id, rating, comment, review_image } = req.body;

    // Only customers can review
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Only customers can write reviews.' });
    }

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    // Validate review image format if provided
    if (review_image && !isValidImageDataUri(review_image)) {
      return res.status(400).json({ message: 'Review photo must be PNG or JPEG format.' });
    }

    // Verify the user has a delivered order for this product
    const [orderCheck] = await db.query(
      `SELECT o.id FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'delivered'
       LIMIT 1`,
      [userId, productId]
    );

    if (orderCheck.length === 0) {
      return res.status(400).json({ message: 'You can only review products from your delivered orders.' });
    }

    const assignedOrderId = orderCheck[0].id;

    // Insert review
    await db.query(
      `INSERT INTO product_reviews (user_id, product_id, order_id, rating, comment, review_image)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, productId, assignedOrderId, rating, comment || null, review_image || null]
    );

    res.status(201).json({ message: 'Review submitted successfully!' });
  } catch (err) {
    console.error('Submit review error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/reviews/seller/:sellerId/rating - Get seller cumulative rating
router.get('/seller/:sellerId/rating', async (req, res) => {
  try {
    const { sellerId } = req.params;

    // Get average rating from all product reviews for this seller's products
    const [result] = await db.query(
      `SELECT
         COUNT(*) as total_reviews,
         COALESCE(AVG(pr.rating), 0) as avg_rating
       FROM product_reviews pr
       JOIN products p ON pr.product_id = p.id
       WHERE p.seller_id = ?`,
      [sellerId]
    );

    // Also get shop reviews if any
    const [shopResult] = await db.query(
      `SELECT
         COUNT(*) as total_reviews,
         COALESCE(AVG(rating), 0) as avg_rating
       FROM shop_reviews
       WHERE seller_id = ?`,
      [sellerId]
    );

    const productReviews = result[0];
    const shopReviews = shopResult[0];

    // Combine both for cumulative rating
    const totalReviews = Number(productReviews.total_reviews) + Number(shopReviews.total_reviews);
    let cumulativeRating = 0;
    if (totalReviews > 0) {
      const totalSum =
        (Number(productReviews.avg_rating) * Number(productReviews.total_reviews)) +
        (Number(shopReviews.avg_rating) * Number(shopReviews.total_reviews));
      cumulativeRating = Number((totalSum / totalReviews).toFixed(1));
    }

    res.json({
      totalReviews,
      avgRating: cumulativeRating,
      productReviewCount: Number(productReviews.total_reviews),
      shopReviewCount: Number(shopReviews.total_reviews),
    });
  } catch (err) {
    console.error('Get seller rating error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
