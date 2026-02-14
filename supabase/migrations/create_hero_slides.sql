-- =====================================================
-- Hero Slider Table Setup
-- Dynamic homepage hero section management
-- =====================================================

-- Create hero_slides table
CREATE TABLE IF NOT EXISTS public.hero_slides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    image_url TEXT NOT NULL,
    title TEXT,
    subtitle TEXT,
    button_text TEXT DEFAULT 'SHOP NOW',
    button_link TEXT DEFAULT '/shop',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add updated_at trigger (using existing function if available)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_hero_slides_updated_at') THEN
            CREATE TRIGGER update_hero_slides_updated_at 
            BEFORE UPDATE ON hero_slides
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active slides" ON hero_slides;
DROP POLICY IF EXISTS "Admins can manage slides" ON hero_slides;

-- Public Select
CREATE POLICY "Anyone can view active slides"
ON hero_slides FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Admin All
CREATE POLICY "Admins can manage slides"
ON hero_slides FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
);

-- Insert a default slide (optional, matching current HeroSection)
INSERT INTO hero_slides (image_url, title, subtitle, display_order)
VALUES (
    'https://res.cloudinary.com/dvz9as9p2/image/upload/v1707823521/hero-jewellery_q8z1z8.jpg', 
    'Elegance That Shines', 
    'Discover handcrafted gold jewellery that celebrates tradition, artistry, and timeless beauty.',
    1
) ON CONFLICT DO NOTHING;
