-- Migration script for existing TasteCebu databases
-- Run this if you already have the database set up

USE tastecebu;

-- Add payment_method to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method ENUM('cod', 'online_payment') DEFAULT 'cod' AFTER total_amount;

-- Add seller tracking to order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS seller_id INT DEFAULT NULL AFTER product_id;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS seller_name VARCHAR(200) DEFAULT NULL AFTER quantity;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS shop_name VARCHAR(200) DEFAULT NULL AFTER seller_name;

-- Add terms agreement to seller_applications
ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS agreed_to_terms TINYINT(1) DEFAULT 0 AFTER business_phone;

-- Product reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  order_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  UNIQUE KEY unique_review (user_id, product_id, order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Shop reviews table
CREATE TABLE IF NOT EXISTS shop_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  seller_id INT NOT NULL,
  order_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  UNIQUE KEY unique_shop_review (user_id, seller_id, order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seller warnings table
CREATE TABLE IF NOT EXISTS seller_warnings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  seller_id INT NOT NULL,
  admin_id INT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
