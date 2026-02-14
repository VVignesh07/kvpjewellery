-- =====================================================
-- Categories Table Setup
-- Complete category management system
-- =====================================================

-- Create categories table
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS Policies for Categories
-- =====================================================

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active categories" ON categories;
DROP POLICY IF EXISTS "Admins can view all categories" ON categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Admins can update categories" ON categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON categories;

-- Public can view active categories
CREATE POLICY "Anyone can view active categories"
ON categories
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Admins can view all categories
CREATE POLICY "Admins can view all categories"
ON categories
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
);

-- Admins can insert categories
CREATE POLICY "Admins can insert categories"
ON categories
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
);

-- Admins can update categories
CREATE POLICY "Admins can update categories"
ON categories
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
);

-- Admins can delete categories
CREATE POLICY "Admins can delete categories"
ON categories
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
);

-- =====================================================
-- Insert Default Categories
-- =====================================================

INSERT INTO categories (name, slug, description, is_active, display_order) VALUES
('Earrings', 'earrings', 'Beautiful earrings collection', true, 1),
('Rings', 'rings', 'Elegant rings for every occasion', true, 2),
('Necklaces', 'necklaces', 'Stunning necklaces and chains', true, 3),
('Bangles', 'bangles', 'Traditional and modern bangles', true, 4),
('Bracelets', 'bracelets', 'Stylish bracelets collection', true, 5),
('Pendants', 'pendants', 'Charming pendants and lockets', true, 6)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- Verification Queries (Optional - for testing)
-- =====================================================

-- Check if categories table exists
-- SELECT * FROM categories ORDER BY display_order;

-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'categories';
