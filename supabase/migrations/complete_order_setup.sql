-- =====================================================
-- Complete Database Setup for Order System
-- Run this entire script in Supabase SQL Editor
-- =====================================================

-- 1. Add payment_method column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cod';

COMMENT ON COLUMN orders.payment_method IS 'Payment method used: upi or cod';

-- =====================================================
-- 2. Fix RLS Policies for Orders and Order Items
-- =====================================================

-- Enable RLS on orders table (if not already enabled)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Enable RLS on order_items table (if not already enabled)
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own order items" ON order_items;
DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;

-- =====================================================
-- User Policies for Orders
-- =====================================================

-- Users can insert their own orders
CREATE POLICY "Users can insert their own orders"
ON orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own orders
CREATE POLICY "Users can view their own orders"
ON orders
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can update their own orders (for status updates)
CREATE POLICY "Users can update their own orders"
ON orders
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- User Policies for Order Items
-- =====================================================

-- Users can insert order items for their orders
CREATE POLICY "Users can insert their own order items"
ON order_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Users can view their own order items
CREATE POLICY "Users can view their own order items"
ON order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- =====================================================
-- Admin Policies (for admin dashboard)
-- =====================================================

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
ON orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Admins can update all orders
CREATE POLICY "Admins can update all orders"
ON orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Admins can view all order items
CREATE POLICY "Admins can view all order items"
ON order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- =====================================================
-- Verification Queries (Optional - for testing)
-- =====================================================

-- Check if payment_method column exists
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'orders' AND column_name = 'payment_method';

-- Check RLS policies on orders table
-- SELECT * FROM pg_policies WHERE tablename = 'orders';

-- Check RLS policies on order_items table
-- SELECT * FROM pg_policies WHERE tablename = 'order_items';
