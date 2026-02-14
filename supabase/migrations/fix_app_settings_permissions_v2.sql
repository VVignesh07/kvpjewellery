-- 1. Create a robust admin check function
-- SECURITY DEFINER allows this function to bypass RLS on the user_roles table
CREATE OR REPLACE FUNCTION public.is_admin_user() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Provide bypass for the authenticated user to manage app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 3. Update Policies to use the new function
DROP POLICY IF EXISTS "Admins can manage settings" ON public.app_settings;
CREATE POLICY "Admins can manage settings" ON public.app_settings 
FOR ALL 
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- 4. Ensure Public can still read
DROP POLICY IF EXISTS "Public can view settings" ON public.app_settings;
CREATE POLICY "Public can view settings" ON public.app_settings 
FOR SELECT 
USING (true);

-- 5. Pre-populate all announcement keys (Important for UPSERT)
INSERT INTO public.app_settings (key, value, description)
VALUES 
    ('announcement_enabled', 'false'::jsonb, 'Toggle to show/hide the top announcement bar'),
    ('announcement_text', '"Welcome to KVP JEWELLERY! Shop our latest collections."'::jsonb, 'The text to display in the top scrolling announcement bar'),
    ('announcement_bg_color', '"#000000"'::jsonb, 'Background color of the announcement bar'),
    ('announcement_text_color', '"#ffffff"'::jsonb, 'Text color of the announcement bar'),
    ('announcement_speed', '20'::jsonb, 'Scrolling speed in seconds (lower is faster)')
ON CONFLICT (key) DO NOTHING;
