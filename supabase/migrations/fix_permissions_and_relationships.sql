-- ================================================================
-- FINAL FIX FOR PERMISSIONS AND RELATIONSHIP ERRORS
-- Run this in your Supabase SQL Editor
-- ================================================================

-- 1. FIX USER_ROLES PERMISSIONS (Resolves 403 Forbidden)
-- Enable RLS on user_roles if not already active
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to insert their own initial 'customer' role
-- This is necessary because AuthContext.tsx attempts to create a role if missing
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
CREATE POLICY "Users can insert their own role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. FIX CART RELATIONSHIP (Resolves PGRST200 / 400 Bad Request)
-- Re-asserting the foreign key helps refresh the PostgREST schema cache
ALTER TABLE IF EXISTS public.cart_items 
DROP CONSTRAINT IF EXISTS cart_items_product_id_fkey;

ALTER TABLE IF EXISTS public.cart_items
ADD CONSTRAINT cart_items_product_id_fkey 
FOREIGN KEY (product_id) 
REFERENCES public.products(id) 
ON DELETE CASCADE;

-- 3. ENSURE CART RLS IS CORRECT
-- (Already mostly done in other scripts, but re-applying to be 100% sure)
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own cart" ON public.cart_items;
CREATE POLICY "Users can manage their own cart"
ON public.cart_items
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Final check: Ensure PostgREST cache is refreshed
NOTIFY pgrst, 'reload schema';
