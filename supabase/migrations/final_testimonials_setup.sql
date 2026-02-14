
-- =====================================================
-- COMPLETE TESTIMONIALS & SETTINGS SETUP
-- Run this entire script to fix the "table not found" errors
-- =====================================================

-- 1. Create Testimonials Table
CREATE TABLE IF NOT EXISTS testimonials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT, -- e.g., "Customer", "Verified Buyer"
    content TEXT NOT NULL,
    rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS for Testimonials
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies for Testimonials
-- Public can view ACTIVE testimonials
DROP POLICY IF EXISTS "Public can view active testimonials" ON testimonials;
CREATE POLICY "Public can view active testimonials" ON testimonials FOR SELECT USING (is_active = true);

-- Admins can manage ALL testimonials
DROP POLICY IF EXISTS "Admins can manage testimonials" ON testimonials;
CREATE POLICY "Admins can manage testimonials" ON testimonials FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

-- Users can insert their own reviews (for the "Write a Review" form)
DROP POLICY IF EXISTS "Users can insert reviews" ON testimonials;
CREATE POLICY "Users can insert reviews" ON testimonials FOR INSERT WITH CHECK (true);

-- 4. Add Product ID connection (if not already there)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'testimonials' AND column_name = 'product_id') THEN
        ALTER TABLE testimonials ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE SET NULL;
        CREATE INDEX idx_testimonials_product_id ON testimonials(product_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'testimonials' AND column_name = 'user_id') THEN
        ALTER TABLE testimonials ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 5. Create App Settings Table
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enable RLS for Settings
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- 7. Policies for Settings
-- Everyone can view settings
DROP POLICY IF EXISTS "Public can view settings" ON app_settings;
CREATE POLICY "Public can view settings" ON app_settings FOR SELECT USING (true);

-- Only admins can update settings
DROP POLICY IF EXISTS "Admins can manage settings" ON app_settings;
CREATE POLICY "Admins can manage settings" ON app_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

-- 8. Insert Default Data
INSERT INTO testimonials (name, content, rating, role) VALUES
('Priya S.', 'Absolutely stunning earrings! The craftsmanship is incredible.', 5, 'Verified Customer'),
('Anita M.', 'Ordered via WhatsApp and received my bangles within 3 days.', 5, 'Verified Customer'),
('Deepa R.', 'The gold necklace I bought was perfect.', 5, 'Verified Customer')
ON CONFLICT DO NOTHING;

INSERT INTO app_settings (key, value, description) VALUES
('testimonials_enabled', 'true'::jsonb, 'Toggle to show/hide the testimonials section on the website homepage')
ON CONFLICT (key) DO NOTHING;
  