-- Function to generate the next order number safely
-- This functions runs with SECURITY DEFINER to bypass RLS for the count
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_next_order_number() TO authenticated;
