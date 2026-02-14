-- ================================================================
-- FINAL SUPABASE SCHEMA FIX
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ================================================================

-- 1. Ensure Profiles table exists and has correct columns
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    phone_number TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. EXPLICITLY ADD FOREIGN KEY FOR ORDERS -> PROFILES
-- This fixes the "Could not find a relationship" error in Admin panel
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN
        -- Drop any conflicting constraints
        ALTER TABLE public.orders 
        DROP CONSTRAINT IF EXISTS orders_user_id_fkey,
        DROP CONSTRAINT IF EXISTS orders_user_id_fkey_profiles;
        
        -- Add the clean relationship
        ALTER TABLE public.orders
        ADD CONSTRAINT orders_user_id_fkey_profiles 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id)
        ON DELETE SET NULL;
        
        RAISE NOTICE '✅ Foreign key for orders -> profiles has been fixed.';
    END IF;
END $$;

-- 3. Restore Missing Dashboard RPC Functions
-- Admin Dashboard Stat Aggregator
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_rev NUMERIC;
  order_count INTEGER;
  product_count INTEGER;
  user_count INTEGER;
BEGIN
  SELECT SUM(total_amount) INTO total_rev FROM public.orders WHERE status != 'cancelled';
  SELECT COUNT(*) INTO order_count FROM public.orders;
  SELECT COUNT(*) INTO product_count FROM public.products;
  SELECT COUNT(*) INTO user_count FROM public.user_roles;

  RETURN jsonb_build_object(
    'totalRevenue', COALESCE(total_rev, 0),
    'totalOrders', COALESCE(order_count, 0),
    'totalProducts', COALESCE(product_count, 0),
    'totalUsers', COALESCE(user_count, 0)
  );
END;
$$;

-- Category Performance Stats
CREATE OR REPLACE FUNCTION get_category_stats()
RETURNS TABLE (category TEXT, product_count BIGINT, total_revenue NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.category,
    COUNT(p.id) as product_count,
    COALESCE(SUM(oi.price * oi.quantity), 0) as total_revenue
  FROM public.products p
  LEFT JOIN public.order_items oi ON oi.product_id = p.id
  LEFT JOIN public.orders o ON o.id = oi.order_id AND o.status != 'cancelled'
  GROUP BY p.category
  ORDER BY total_revenue DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_category_stats() TO authenticated;

-- Sales Trend Data for Charts
CREATE OR REPLACE FUNCTION get_sales_chart_data(days_count INTEGER DEFAULT 30)
RETURNS TABLE (day DATE, revenue NUMERIC, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d::DATE as day,
    COALESCE(SUM(o.total_amount), 0) as revenue,
    COUNT(o.id) as count
  FROM (
    SELECT CURRENT_DATE - i as d
    FROM generate_series(0, days_count - 1) i
  ) days
  LEFT JOIN public.orders o ON o.created_at::DATE = days.d AND o.status != 'cancelled'
  GROUP BY d
  ORDER BY d ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_sales_chart_data(INTEGER) TO authenticated;

-- 4. Ensure Notifications Table and Trigger exist
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    link TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (title, message, type, link, metadata)
    VALUES (
        'New Order Received! 🛍️',
        'Order ' || NEW.order_number || ' has been placed.',
        'order',
        '/admin/orders',
        jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_new_order ON public.orders;
CREATE TRIGGER trg_notify_new_order
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION notify_new_order();

-- 5. Enable RLS and Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
CREATE POLICY "Admins can manage notifications" ON public.notifications
FOR ALL TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- 6. Stock Status Synchronization
CREATE OR REPLACE FUNCTION sync_stock_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Force 'stock' string to match numeric quantity
    IF NEW.stock_quantity <= 0 THEN
        NEW.stock := 'Out of Stock';
        NEW.stock_quantity := 0; -- Ensure no negative
    ELSIF NEW.stock_quantity < 5 THEN
        NEW.stock := 'Low Stock';
    ELSE
        NEW.stock := 'In Stock';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_stock_status ON public.products;
CREATE TRIGGER trg_sync_stock_status
BEFORE INSERT OR UPDATE OF stock_quantity ON public.products
FOR EACH ROW EXECUTE FUNCTION sync_stock_status();

-- Sync ALL existing products status immediately
UPDATE public.products SET stock_quantity = COALESCE(stock_quantity, 0);

-- 7. Reload Schema Cache
NOTIFY pgrst, 'reload schema';
