-- =====================================================
-- Allow Admins to Delete Orders and Order Items
-- Run this script in Supabase SQL Editor
-- =====================================================

-- 1. Allow admins to delete from order_items
CREATE POLICY "Admins can delete order items"
ON order_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- 2. Allow admins to delete from orders
CREATE POLICY "Admins can delete orders"
ON orders
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- =====================================================
-- Verification
-- =====================================================
-- SELECT * FROM pg_policies WHERE policyname LIKE '%delete%';
