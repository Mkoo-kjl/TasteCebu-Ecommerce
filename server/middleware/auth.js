const jwt = require('jsonwebtoken');
const path = require('path');
const db = require('../db');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'tastecebu_fallback_secret';

// Verify JWT token and attach user to request
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const [users] = await db.query('SELECT id, name, email, phone, address, avatar, role FROM users WHERE id = ?', [decoded.id]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'User not found.' });
    }

    req.user = users[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.' });
    }
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

// Require admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  next();
};

// Require seller role
const requireSeller = (req, res, next) => {
  if (req.user.role !== 'seller' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Seller access required.' });
  }
  next();
};

// Require customer role (blocks seller and admin from cart/orders)
const requireCustomer = (req, res, next) => {
  if (req.user.role !== 'user') {
    return res.status(403).json({ message: 'Only customers can perform this action.' });
  }
  next();
};

module.exports = { requireAuth, requireAdmin, requireSeller, requireCustomer };
