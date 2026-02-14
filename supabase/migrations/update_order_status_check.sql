-- Remove the old constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add the new constraint with 'pending_payment' included
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'pending_payment', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'));
