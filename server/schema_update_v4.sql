-- TasteCebu Schema Update v4: Soft-delete conversations
USE tastecebu;

-- Add soft-delete flags to conversations table
ALTER TABLE conversations ADD COLUMN deleted_by_customer TINYINT(1) DEFAULT 0;
ALTER TABLE conversations ADD COLUMN deleted_by_seller TINYINT(1) DEFAULT 0;
