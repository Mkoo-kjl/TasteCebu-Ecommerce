-- Migration 2: Additional features
USE tastecebu;

-- Add 'approved' to order status enum
ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'approved', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending';

-- Product images table (multiple images per product, up to 10)
CREATE TABLE IF NOT EXISTS product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image LONGTEXT NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add review_image to product_reviews
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS review_image LONGTEXT DEFAULT NULL AFTER comment;

-- Add review_image to shop_reviews
ALTER TABLE shop_reviews ADD COLUMN IF NOT EXISTS review_image LONGTEXT DEFAULT NULL AFTER comment;
