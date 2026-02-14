-- Create wishlist_items table
CREATE TABLE IF NOT EXISTS public.wishlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

-- Policies for wishlist_items
CREATE POLICY "Users can view their own wishlist items"
    ON public.wishlist_items FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can add items to their own wishlist"
    ON public.wishlist_items FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove items from their own wishlist"
    ON public.wishlist_items FOR DELETE
    USING (auth.uid() = user_id);

-- Enable realtime for wishlist_items
ALTER PUBLICATION supabase_realtime ADD TABLE public.wishlist_items;
