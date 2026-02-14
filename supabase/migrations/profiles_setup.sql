-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    phone_number TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key relationship if orders table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN
        ALTER TABLE public.orders 
        DROP CONSTRAINT IF EXISTS orders_user_id_fkey_profiles,
        ADD CONSTRAINT orders_user_id_fkey_profiles 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON public.profiles(phone_number);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Robust Trigger to create profile and role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_username TEXT;
    user_phone TEXT;
BEGIN
    -- 1. Determine Username
    -- Priority: Metadata 'username' -> Metadata 'phone' -> Email prefix
    user_username := COALESCE(
        NEW.raw_user_meta_data->>'username',
        NEW.raw_user_meta_data->>'phone',
        SPLIT_PART(NEW.email, '@', 1)
    );
    
    -- 2. Determine Phone
    user_phone := COALESCE(
        NEW.phone,
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'phone_number'
    );

    -- 3. Create Profile
    -- We use ON CONFLICT (id) to update existing profiles if they exist
    -- We use COALESCE and EXCLUDED to ensure we don't overwrite with NULL
    INSERT INTO public.profiles (id, full_name, username, email, phone_number)
    VALUES (
        NEW.id, 
        NEW.raw_user_meta_data->>'full_name', 
        user_username,
        NEW.email,
        user_phone
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        username = COALESCE(EXCLUDED.username, profiles.username),
        email = COALESCE(EXCLUDED.email, profiles.email),
        phone_number = COALESCE(EXCLUDED.phone_number, profiles.phone_number),
        updated_at = NOW();

    -- 4. Assign Default 'customer' Role
    -- SECURITY DEFINER ensures this trigger can insert even if RLS is strict
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'customer')
    ON CONFLICT (user_id) DO NOTHING;
        
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error details if possible or just let it fail gracefully
    RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-enable the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sync/Backfill existing users
INSERT INTO public.profiles (id, full_name, username, email, phone_number)
SELECT 
    id, 
    raw_user_meta_data->>'full_name',
    COALESCE(raw_user_meta_data->>'username', SPLIT_PART(email, '@', 1)),
    email,
    phone
FROM auth.users
ON CONFLICT (id) DO NOTHING;
