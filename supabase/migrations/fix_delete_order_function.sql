-- =====================================================
-- FIX ADMIN DELETE FUNCTIONALITY - MASTER SCRIPT
-- Run this entire script in Supabase SQL Editor
-- =====================================================

-- 1. Create the secure delete function
CREATE OR REPLACE FUNCTION delete_order(order_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    curr_user_id UUID;
    is_admin BOOLEAN;
BEGIN
    -- Get current user ID
    curr_user_id := auth.uid();
    
    -- Check if the user is an admin
    SELECT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = curr_user_id
        AND user_roles.role = 'admin'
    ) INTO is_admin;
    
    IF NOT is_admin THEN
        RAISE EXCEPTION 'Access denied. Only admins can delete orders.';
    END IF;

    -- Delete associated order items first
    DELETE FROM order_items WHERE order_id = order_id_param;
    
    -- Delete the order
    DELETE FROM orders WHERE id = order_id_param;
END;
$$;

-- 2. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_order(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_order(UUID) TO service_role;

-- 3. Ensure RLS policies don't block deletion (Backup safety)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Drop secure delete policies if they exist to refresh them
DROP POLICY IF EXISTS "Admins can delete orders" ON orders;
DROP POLICY IF EXISTS "Admins can delete order items" ON order_items;

-- Re-create delete policies
CREATE POLICY "Admins can delete orders"
ON orders FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete order items"
ON order_items FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);
