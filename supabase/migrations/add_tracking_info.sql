-- Add tracking number and tracking URL to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS tracking_url TEXT;

COMMENT ON COLUMN public.orders.tracking_number IS 'Tracking number for the shipment';
COMMENT ON COLUMN public.orders.tracking_url IS 'Direct link to the courier tracking page';
