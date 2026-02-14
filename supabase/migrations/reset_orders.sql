-- Reset all order data
-- This will delete all order items first (due to foreign key constraints) 
-- and then all orders.

DELETE FROM order_items;
DELETE FROM orders;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

-- After running this, the function get_next_order_number() 
-- will naturally start back at KVP-001 because it uses 
-- SELECT count(*) + 1 FROM orders;
