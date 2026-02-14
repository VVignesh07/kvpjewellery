-- =====================================================
-- Secure Delete Order Function
-- Run this script in Supabase SQL Editor
-- =====================================================

-- Create a function to delete an order and its items securely
CREATE OR REPLACE FUNCTION delete_order(order_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres)
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

    -- Delete associated order items first (if foreign key cascade isn't set)
    DELETE FROM order_items WHERE order_id = order_id_param;
    
    -- Delete the order
    DELETE FROM orders WHERE id = order_id_param;
END;
$$;
