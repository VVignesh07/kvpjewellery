-- ================================================================
-- MASTER FIX FOR CART & CHECKOUT ERRORS
-- Run this ENTIRE script in Supabase SQL Editor
-- ================================================================

-- 1. FIX CART: Create the missing cart_items table
CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, product_id)
);

-- Enable Security for Cart
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own cart
DROP POLICY IF EXISTS "Users can view their own cart items" ON public.cart_items;
CREATE POLICY "Users can view their own cart items" ON public.cart_items FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert into their own cart items" ON public.cart_items;
CREATE POLICY "Users can insert into their own cart items" ON public.cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own cart items" ON public.cart_items;
CREATE POLICY "Users can update their own cart items" ON public.cart_items FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own cart items" ON public.cart_items;
CREATE POLICY "Users can delete their own cart items" ON public.cart_items FOR DELETE USING (auth.uid() = user_id);


-- 2. FIX ORDER STATUS: Allow 'pending_payment' for UPI
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'pending_payment', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'));


-- 3. FIX ORDER NUMBER: Create secure function to generate KVP-XXX IDs
CREATE OR REPLACE FUNCTION get_next_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  -- Get count of all orders (bypassing RLS)
  SELECT count(*) + 1 INTO next_num FROM orders;
  
  -- Return formatted order number (e.g., KVP-005)
  RETURN 'KVP-' || lpad(next_num::TEXT, 3, '0');
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_next_order_number() TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_order_number() TO anon; -- Allow guest checkout if needed, though usually auth only
