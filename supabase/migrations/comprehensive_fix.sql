-- =====================================================
-- COMPREHENSIVE FIX: TABLES & PREMIUM DATA
-- 1. Create hero_slides table
-- 2. Create wishlist_items table
-- 3. Seed 5 Premium Model Hero Banners
-- =====================================================

-- 1. HERO SLIDES TABLE
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

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active slides" ON hero_slides;
DROP POLICY IF EXISTS "Admins can manage slides" ON hero_slides;

CREATE POLICY "Anyone can view active slides" ON hero_slides FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admins can manage slides" ON hero_slides FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- 2. WISHLIST ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.wishlist_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own wishlist" ON wishlist_items;

CREATE POLICY "Users can manage their own wishlist" ON wishlist_items FOR ALL TO authenticated 
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. SEED PREMIUM MODEL BANNERS
DELETE FROM public.hero_slides;

INSERT INTO public.hero_slides (image_url, title, subtitle, button_text, button_link, display_order, is_active)
VALUES 
('https://images.unsplash.com/photo-1596450514735-3004bbbb5512?q=80&w=1974&auto=format&fit=crop', 'The Bridal Edit', 'Experience the grandeur of 22k gold bridal sets designed for your special day.', 'EXPLORE BRIDAL', '/shop?category=Necklace', 1, true),
('https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=2080&auto=format&fit=crop', 'Diamond Elegance', 'Modern solitaires and diamond necklaces that define sophistication.', 'SHOP DIAMONDS', '/shop?category=Ring', 2, true),
('https://images.unsplash.com/photo-1617038220319-276d3cfab638?q=80&w=1974&auto=format&fit=crop', 'Traditional Jhumkas', 'Celebrate heritage with our intricately carved gold temple earrings.', 'VIEW EARRINGS', '/shop?category=Earrings', 3, true),
('https://images.unsplash.com/photo-1619119069172-8c9914c90002?q=80&w=2071&auto=format&fit=crop', 'Artistic Bangle Sets', 'Handcrafted bangles and bracelets that add a touch of gold to every gesture.', 'SHOP BANGLES', '/shop?category=Bangle', 4, true),
('https://images.unsplash.com/photo-1620656403207-6c841cbda885?q=80&w=1964&auto=format&fit=crop', 'The Festive Collection', 'Find the perfect match for every occasion with our curated fancy jewellery.', 'SHOP NOW', '/shop', 5, true);
