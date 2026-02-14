-- Function to generate the next order number safely using a sequence
-- Create sequence if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

CREATE OR REPLACE FUNCTION get_next_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_val INTEGER;
BEGIN
  -- Get the next value from the sequence
  next_val := nextval('order_number_seq');
  
  -- Return formatted order number (e.g., KVP-001)
  RETURN 'KVP-' || lpad(next_val::TEXT, 3, '0');
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_next_order_number() TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_order_number() TO anon;
