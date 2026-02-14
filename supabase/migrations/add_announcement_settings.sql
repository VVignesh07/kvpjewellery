-- Add Announcement Bar Settings
INSERT INTO app_settings (key, value, description) VALUES
('announcement_enabled', 'true'::jsonb, 'Toggle to show/hide the top announcement bar'),
('announcement_text', '"Welcome to KVP Fancy Jewellery! Free Shipping on Orders Above ₹5000"'::jsonb, 'Text to display in the announcement bar'),
('announcement_bg_color', '"#000000"'::jsonb, 'Background color of the announcement bar'),
('announcement_text_color', '"#ffffff"'::jsonb, 'Text color of the announcement bar')
ON CONFLICT (key) DO NOTHING;
