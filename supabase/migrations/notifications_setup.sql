-- ================================================================
-- ADMIN NOTIFICATION SYSTEM
-- Run this in the Supabase SQL Editor
-- ================================================================

-- 1. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'order', 'customer', 'inventory', 'info'
    is_read BOOLEAN DEFAULT false,
    link TEXT, -- Optional link to orders or products
    metadata JSONB, -- Store order_id, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Delete old duplicate trigger if exists (safety)
DROP TRIGGER IF EXISTS trg_notify_new_order ON public.orders;

-- 2. Create Trigger Function for New Orders
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (
        title,
        message,
        type,
        link,
        metadata
    ) VALUES (
        'New Order Received! 🛍️',
        'Order ' || NEW.order_number || ' has been placed by ' || 
        COALESCE((NEW.shipping_address->>'name'), 'a customer') || '.',
        'order',
        '/admin/orders',
        jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach Trigger
CREATE TRIGGER trg_notify_new_order
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION notify_new_order();

-- 4. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 5. Policies: Only admins can see/modify notifications
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
CREATE POLICY "Admins can manage notifications" ON public.notifications
FOR ALL TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- 6. Grants
GRANT ALL ON public.notifications TO authenticated;

-- 7. Performance Index
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
