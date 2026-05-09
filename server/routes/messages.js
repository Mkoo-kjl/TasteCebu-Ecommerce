const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/messages/conversations - List all conversations for current user
router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [conversations] = await db.query(`
      SELECT c.*,
        CASE WHEN c.customer_id = ? THEN s.name ELSE cu.name END as other_name,
        CASE WHEN c.customer_id = ? THEN s.avatar ELSE cu.avatar END as other_avatar,
        CASE WHEN c.customer_id = ? THEN s.id ELSE cu.id END as other_id,
        CASE WHEN c.customer_id = ? THEN 'seller' ELSE 'customer' END as other_role,
        CASE WHEN c.customer_id = ? THEN sa.business_name ELSE NULL END as business_name,
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = 0) as unread_count
      FROM conversations c
      JOIN users cu ON c.customer_id = cu.id
      JOIN users s ON c.seller_id = s.id
      LEFT JOIN seller_applications sa ON c.seller_id = sa.user_id AND sa.status = 'approved'
      WHERE c.customer_id = ? OR c.seller_id = ?
      ORDER BY c.last_message_at DESC
    `, [userId, userId, userId, userId, userId, userId, userId, userId]);

    res.json({ conversations });
  } catch (err) {
    console.error('Get conversations error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/messages/conversations - Start or get existing conversation
router.post('/conversations', requireAuth, async (req, res) => {
  try {
    const { seller_id } = req.body;
    const customerId = req.user.id;

    if (!seller_id) {
      return res.status(400).json({ message: 'seller_id is required.' });
    }

    if (seller_id === customerId) {
      return res.status(400).json({ message: 'You cannot message yourself.' });
    }

    // Verify seller exists and is actually a seller
    const [sellers] = await db.query(
      'SELECT id, role FROM users WHERE id = ? AND role = ?',
      [seller_id, 'seller']
    );
    if (sellers.length === 0) {
      return res.status(404).json({ message: 'Seller not found.' });
    }

    // Check if conversation already exists
    const [existing] = await db.query(
      'SELECT id FROM conversations WHERE customer_id = ? AND seller_id = ?',
      [customerId, seller_id]
    );

    if (existing.length > 0) {
      return res.json({ conversation_id: existing[0].id });
    }

    // Create new conversation
    const [result] = await db.query(
      'INSERT INTO conversations (customer_id, seller_id) VALUES (?, ?)',
      [customerId, seller_id]
    );

    res.status(201).json({ conversation_id: result.insertId });
  } catch (err) {
    console.error('Create conversation error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/messages/conversations/:id - Get messages for a conversation
router.get('/conversations/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;

    // Verify user is part of this conversation
    const [conv] = await db.query(
      'SELECT * FROM conversations WHERE id = ? AND (customer_id = ? OR seller_id = ?)',
      [conversationId, userId, userId]
    );
    if (conv.length === 0) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    const [messages] = await db.query(`
      SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at ASC
    `, [conversationId]);

    // Get other participant info
    const otherUserId = conv[0].customer_id === userId ? conv[0].seller_id : conv[0].customer_id;
    const [otherUser] = await db.query(
      'SELECT id, name, avatar, role FROM users WHERE id = ?',
      [otherUserId]
    );

    let businessName = null;
    if (otherUser[0]?.role === 'seller') {
      const [sa] = await db.query(
        "SELECT business_name FROM seller_applications WHERE user_id = ? AND status = 'approved'",
        [otherUserId]
      );
      if (sa.length > 0) businessName = sa[0].business_name;
    }

    res.json({
      conversation: conv[0],
      messages,
      other_user: otherUser[0] ? { ...otherUser[0], business_name: businessName } : null
    });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/messages/conversations/:id - Send a message
router.post('/conversations/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required.' });
    }

    // Verify user is part of this conversation
    const [conv] = await db.query(
      'SELECT * FROM conversations WHERE id = ? AND (customer_id = ? OR seller_id = ?)',
      [conversationId, userId, userId]
    );
    if (conv.length === 0) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    // Insert message
    const [result] = await db.query(
      'INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)',
      [conversationId, userId, content.trim()]
    );

    // Update last_message_at
    await db.query(
      'UPDATE conversations SET last_message_at = NOW() WHERE id = ?',
      [conversationId]
    );

    // Return the new message
    const [newMessage] = await db.query(`
      SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
      FROM messages m JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `, [result.insertId]);

    res.status(201).json({ message: newMessage[0] });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/messages/conversations/:id/read - Mark messages as read
router.put('/conversations/:id/read', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;

    // Verify user is part of this conversation
    const [conv] = await db.query(
      'SELECT * FROM conversations WHERE id = ? AND (customer_id = ? OR seller_id = ?)',
      [conversationId, userId, userId]
    );
    if (conv.length === 0) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    // Mark all messages from the OTHER user as read
    await db.query(
      'UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ?',
      [conversationId, userId]
    );

    res.json({ message: 'Messages marked as read.' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/messages/unread-count - Get total unread message count
router.get('/unread-count', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [[{ count }]] = await db.query(`
      SELECT COUNT(*) as count
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE (c.customer_id = ? OR c.seller_id = ?)
        AND m.sender_id != ?
        AND m.is_read = 0
    `, [userId, userId, userId]);

    res.json({ unread_count: count });
  } catch (err) {
    console.error('Unread count error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
