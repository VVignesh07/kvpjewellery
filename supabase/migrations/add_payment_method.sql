-- Add payment_method column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cod';

-- Add comment to the column
COMMENT ON COLUMN orders.payment_method IS 'Payment method used: upi or cod';
