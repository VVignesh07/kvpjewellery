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

-- Robust Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_username TEXT;
    user_phone TEXT;
BEGIN
    -- Try to get username and phone from various possible metadata keys
    user_username := COALESCE(
        NEW.raw_user_meta_data->>'username',
        SPLIT_PART(NEW.email, '@', 1)
    );
    
    user_phone := COALESCE(
        NEW.phone,
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'phone_number'
    );

    INSERT INTO public.profiles (id, full_name, username, email, phone_number)
    VALUES (
        NEW.id, 
        NEW.raw_user_meta_data->>'full_name', 
        user_username,
        NEW.email,
        user_phone
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        phone_number = EXCLUDED.phone_number,
        updated_at = NOW();
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
