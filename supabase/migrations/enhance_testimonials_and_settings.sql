
-- =====================================================
-- 1. Enhance Testimonials Table for Product Reviews
-- =====================================================

-- Add product_id to link reviews to specific products
ALTER TABLE testimonials 
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for faster lookups by product
CREATE INDEX IF NOT EXISTS idx_testimonials_product_id ON testimonials(product_id);

-- =====================================================
-- 2. Create Global App Settings Table
-- =====================================================

CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can view settings (needed for website to know if testimonials are enabled)
DROP POLICY IF EXISTS "Public can view settings" ON app_settings;
CREATE POLICY "Public can view settings" ON app_settings FOR SELECT USING (true);

-- Only admins can update settings
DROP POLICY IF EXISTS "Admins can manage settings" ON app_settings;
CREATE POLICY "Admins can manage settings" ON app_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

-- Insert Default Settings
INSERT INTO app_settings (key, value, description) VALUES
('testimonials_enabled', 'true'::jsonb, 'Toggle to show/hide the testimonials section on the website homepage')
ON CONFLICT (key) DO NOTHING;
