-- Migration to create custom users table for Node.js Auth
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'customer')) NOT NULL,
  status TEXT CHECK (status IN ('active', 'blocked')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for email search
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
