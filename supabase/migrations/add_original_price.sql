-- Add original_price column to products table for discount calculation
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price NUMERIC;
