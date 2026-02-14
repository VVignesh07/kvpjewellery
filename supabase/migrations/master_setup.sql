-- =====================================================
-- MASTER SETUP SCRIPT - KVP JEWEL SUITE
-- Run this ENTIRE script in Supabase SQL Editor
-- This fixes: Missing Categories, Delete Order Error, Permissions
-- =====================================================

-- 1. Create CATEGORIES Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexing for speed
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- 2. Enable RLS (Security)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies (Who can do what)

-- Categories: Everyone can view, Admins can manage
DROP POLICY IF EXISTS "Anyone can view active categories" ON categories;
CREATE POLICY "Anyone can view active categories" ON categories FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
CREATE POLICY "Admins can manage categories" ON categories FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

-- Orders: Users see own, Admins see all & delete
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

DROP POLICY IF EXISTS "Admins can update all orders" ON orders;
CREATE POLICY "Admins can update all orders" ON orders FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

-- 4. Secure Delete Function (Fixes Delete Error)
CREATE OR REPLACE FUNCTION delete_order(order_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    -- Check admin
    SELECT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    ) INTO is_admin;
    
    IF NOT is_admin THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Delete items then order
    DELETE FROM order_items WHERE order_id = order_id_param;
    DELETE FROM orders WHERE id = order_id_param;
END;
$$;

-- Grant Permission
GRANT EXECUTE ON FUNCTION delete_order(UUID) TO authenticated;

-- 5. Insert Default Categories (If not exist)
INSERT INTO categories (name, slug, description, is_active, display_order) VALUES
('Earrings', 'earrings', 'Beautiful earrings', true, 1),
('Rings', 'rings', 'Elegant rings', true, 2),
('Necklaces', 'necklaces', 'Stunning necklaces', true, 3),
('Bangles', 'bangles', 'Traditional bangles', true, 4),
('Bracelets', 'bracelets', 'Stylish bracelets', true, 5),
('Pendants', 'pendants', 'Charming pendants', true, 6)
ON CONFLICT (slug) DO NOTHING;

-- Done!
