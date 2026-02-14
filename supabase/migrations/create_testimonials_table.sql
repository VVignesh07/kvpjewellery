
-- =====================================================
-- Create Testimonials Table & Permissions
-- =====================================================

CREATE TABLE IF NOT EXISTS testimonials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT, -- e.g., "Customer", "Happy Client"
    content TEXT NOT NULL,
    rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- 1. Public can view ACTIVE testimonials
DROP POLICY IF EXISTS "Public can view active testimonials" ON testimonials;
CREATE POLICY "Public can view active testimonials" ON testimonials FOR SELECT USING (is_active = true);

-- 2. Admins can manage ALL testimonials
DROP POLICY IF EXISTS "Admins can manage testimonials" ON testimonials;
CREATE POLICY "Admins can manage testimonials" ON testimonials FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

-- Insert Default Data
INSERT INTO testimonials (name, content, rating, role) VALUES
('Priya S.', 'Absolutely stunning earrings! The craftsmanship is incredible. Will definitely order again.', 5, 'Verified Customer'),
('Anita M.', 'Ordered via WhatsApp and received my bangles within 3 days. Beautiful quality and packaging!', 5, 'Verified Customer'),
('Deepa R.', 'The gold necklace I bought for my daughter''s wedding was perfect. Everyone complimented it!', 5, 'Verified Customer')
ON CONFLICT DO NOTHING;
