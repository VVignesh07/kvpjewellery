-- =====================================================
-- ADMIN LOGIN EMERGENCY FIX
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- =====================================================

-- 1. Create the user role table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role TEXT NOT NULL CHECK (role IN ('admin', 'customer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RESET/SET PASSWORD for your admin email
-- Note: Replace 'admin@kvp.com' and 'your_new_password' with your desired values
-- This uses the built-in Supabase auth.users table update
UPDATE auth.users
SET encrypted_password = crypt('admin123', gen_salt('bf')), -- sets password to 'admin123'
    email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'thekvpstore@gmail.com'; -- Replace with your actual email

-- 3. ENSURE ADMIN ROLE is assigned
-- Note: Replace 'thekvpstore@gmail.com' with your same email
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'thekvpstore@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- 4. VERIFY - Run this to see your admin user in the role table
SELECT 
    au.email, 
    ur.role 
FROM auth.users au
JOIN user_roles ur ON au.id = ur.user_id
WHERE ur.role = 'admin';
