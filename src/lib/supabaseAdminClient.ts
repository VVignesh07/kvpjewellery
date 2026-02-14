import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

// Dedicated client for Admin side with its own storage key
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storageKey: 'sb-admin-auth-token',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false // Prevent interference with customer flows
    }
});
