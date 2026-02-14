-- =====================================================
-- Promote User to Admin
-- Run this in Supabase SQL Editor
-- =====================================================

-- Replace 'YOUR_EMAIL_HERE' with your login email
-- Example: 'admin@kvp.com'

INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE' -- <--- PUT YOUR EMAIL HERE
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Verify the role
SELECT * FROM user_roles;
