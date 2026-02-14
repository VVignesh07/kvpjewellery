-- Add shipping_fee column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC DEFAULT 0;

COMMENT ON COLUMN public.orders.shipping_fee IS 'Shipping charge for the order';

-- Update existing orders to have 0 shipping fee if they don't have one
UPDATE public.orders SET shipping_fee = 0 WHERE shipping_fee IS NULL;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
