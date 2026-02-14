-- =====================================================
-- MASTER ADMIN CREATION & RESET SCRIPT
-- Run this in Supabase SQL Editor
-- This ensures the user exists, has a password, and is an Admin.
-- =====================================================

DO $$
DECLARE
  target_email TEXT := 'thekvpstore@gmail.com';
  target_pass TEXT := 'adminKVP123';
  new_user_id UUID;
BEGIN
  -- 1. Check if user already exists in auth.users
  SELECT id INTO new_user_id FROM auth.users WHERE email = target_email;

  IF new_user_id IS NULL THEN
    -- User doesn't exist, create them
    new_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, 
      raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at, confirmation_token
    )
    VALUES (
      new_user_id, '00000000-0000-0000-0000-000000000000', target_email, 
      crypt(target_pass, gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated', now(), now(), ''
    );

    -- Create identity record (Crucial for Supabase to recognize the user)
    INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
      new_user_id, new_user_id, 
      format('{"sub":"%s","email":"%s"}', new_user_id::text, target_email)::jsonb, 
      'email', now(), now(), now()
    );
    
    RAISE NOTICE 'Created new user with ID: %', new_user_id;
  ELSE
    -- User exists, just update the password
    UPDATE auth.users
    SET encrypted_password = crypt(target_pass, gen_salt('bf')),
        email_confirmed_at = NOW(),
        updated_at = NOW()
    WHERE id = new_user_id;
    
    RAISE NOTICE 'Updated existing user with ID: %', new_user_id;
  END IF;

  -- 2. Ensure the user_roles table exists and assign 'admin'
  CREATE TABLE IF NOT EXISTS public.user_roles (
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
      role TEXT NOT NULL CHECK (role IN ('admin', 'customer')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new_user_id, 'admin')
  ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

END $$;

-- 3. FINAL VERIFICATION
SELECT au.email, ur.role, au.email_confirmed_at
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
WHERE au.email = 'thekvpstore@gmail.com';
