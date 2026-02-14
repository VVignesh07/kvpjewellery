-- 1. DELETE ALL EXISTING ORDERS (Required for Reset)
DELETE FROM order_items;
DELETE FROM orders;

-- 2. CREATE A SEQUENCE FOR ORDER NUMBERS
-- This ensures numbers are unique and sequential even if rows are deleted
DROP SEQUENCE IF EXISTS order_number_seq;
CREATE SEQUENCE order_number_seq START 1;

-- 3. UPDATE THE FUNCTION TO USE THE SEQUENCE
CREATE OR REPLACE FUNCTION get_next_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_val INTEGER;
BEGIN
  -- Fetch the next value from our sequence
  next_val := nextval('order_number_seq');
  
  -- Return formatted order number (e.g., KVP-001, KVP-002)
  RETURN 'KVP-' || lpad(next_val::TEXT, 3, '0');
END;
$$;

-- 4. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION get_next_order_number() TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_order_number() TO anon; -- For guest checkout if applicable

-- 5. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
