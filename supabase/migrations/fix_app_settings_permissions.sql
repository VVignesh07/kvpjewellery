-- Ensure all announcement-related keys exist with sensible defaults
INSERT INTO app_settings (key, value, description)
VALUES 
    ('announcement_enabled', 'false'::jsonb, 'Toggle to show/hide the top announcement bar'),
    ('announcement_text', '"Welcome to KVP JEWELLERY! Shop our latest collections."'::jsonb, 'The text to display in the top scrolling announcement bar'),
    ('announcement_bg_color', '"#000000"'::jsonb, 'Background color of the announcement bar'),
    ('announcement_text_color', '"#ffffff"'::jsonb, 'Text color of the announcement bar'),
    ('announcement_speed', '20'::jsonb, 'Scrolling speed in seconds (lower is faster)')
ON CONFLICT (key) DO UPDATE 
SET updated_at = NOW();

-- Ensure RLS is active
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Re-create the admin management policy with a more robust check
DROP POLICY IF EXISTS "Admins can manage settings" ON app_settings;
CREATE POLICY "Admins can manage settings" ON app_settings FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Also ensure public can SELECT
DROP POLICY IF EXISTS "Public can view settings" ON app_settings;
CREATE POLICY "Public can view settings" ON app_settings FOR SELECT USING (true);
