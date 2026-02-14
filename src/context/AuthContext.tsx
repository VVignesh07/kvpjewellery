import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { User, Session, AuthError, PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

interface Profile {
    id: string;
    username: string | null;
    phone_number: string | null;
    full_name: string | null;
    avatar_url: string | null;
}

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    userRole: string | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signInWithOTP: (email: string) => Promise<{ error: AuthError | null }>;
    signInWithIdentifier: (identifier: string, password: string) => Promise<{ error: AuthError | null | { message: string } }>;
    verifyOTP: (email: string, token: string) => Promise<{ error: AuthError | null }>;
    signUp: (data: { email?: string; password: string; fullName?: string; username?: string; phone?: string }) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
    isAdmin: () => boolean;
    displayIdentifier: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (error) {
            console.error('Error fetching profile:', error);
        } else if (data) {
            setProfile(data);
        }
    }, []);

    const fetchUserRole = useCallback(async (userId: string) => {
        const { data, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            console.error('Error fetching user role:', error);
            setUserRole('customer');
        } else if (!data) {
            console.log('No role found for user, creating customer role...');
            await supabase
                .from('user_roles')
                .insert({ user_id: userId, role: 'customer' });
            setUserRole('customer');
        } else {
            setUserRole(data.role || 'customer');
        }
    }, []);

    useEffect(() => {
        let mounted = true;

        // Initialize session
        const initSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!mounted) return;

                if (session?.user) {
                    setSession(session);
                    setUser(session.user);
                    // Fetch profile and role
                    await Promise.all([
                        fetchProfile(session.user.id),
                        fetchUserRole(session.user.id)
                    ]);
                    if (mounted) setLoading(false);
                } else {
                    setSession(null);
                    setUser(null);
                    setProfile(null);
                    setLoading(false);
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                setLoading(false);
            }
        };

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (_event === 'SIGNED_IN') {
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    Promise.all([
                        fetchProfile(session.user.id),
                        fetchUserRole(session.user.id)
                    ]).finally(() => {
                        setLoading(false);
                    });
                } else {
                    setLoading(false);
                }
            } else if (_event === 'SIGNED_OUT') {
                setSession(null);
                setUser(null);
                setProfile(null);
                setUserRole(null);
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [fetchProfile, fetchUserRole]);

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error };
    };

    const signInWithIdentifier = async (identifier: string, password: string) => {
        const trimmedIdentifier = identifier.trim();
        console.log('🔑 Attempting login for:', trimmedIdentifier);

        // 1. Try Email direct sign in
        if (trimmedIdentifier.includes('@')) {
            console.log('ℹ️ Detected email format, signing in directly.');
            return await signIn(trimmedIdentifier, password);
        }

        // 2. Try Phone or Username lookup
        // We use quotes "val" for values in .or() to handle special characters
        console.log(`🔍 Searching profiles for identifier: "${trimmedIdentifier}"`);
        const { data: profileData, error: lookupError } = await supabase
            .from('profiles')
            .select('email, username, phone_number')
            .or(`username.eq."${trimmedIdentifier}",phone_number.eq."${trimmedIdentifier}"`)
            .maybeSingle();

        if (lookupError) {
            console.error('❌ Profile lookup query error:', lookupError);
        }

        if (profileData?.email) {
            console.log('✅ Found account email:', profileData.email);
            return await signIn(profileData.email, password);
        }

        console.warn('⚠️ No account found with that username or phone number.');
        // Fallback or Error
        return { error: { message: "Invalid username, phone, or password. Please try again." } };
    };

    const signInWithOTP = async (email: string) => {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { shouldCreateUser: true }
        });
        return { error };
    };

    const verifyOTP = async (email: string, token: string) => {
        const { error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email'
        });
        return { error };
    };

    const signUp = async (data: { email?: string; password: string; fullName?: string; username?: string; phone?: string }) => {
        // Generate a placeholder email if none provided
        const userEmail = data.email || `${data.username || Date.now()}@kvp.internal`;

        const { data: authData, error } = await supabase.auth.signUp({
            email: userEmail,
            password: data.password,
            options: {
                data: {
                    full_name: data.fullName,
                    username: data.username,
                    phone: data.phone
                }
            }
        });

        if (!error && authData.user) {
            // Role assignment
            await supabase.from('user_roles').upsert({
                user_id: authData.user.id,
                role: 'customer'
            }, { onConflict: 'user_id' });

            // Profile update (Ensure everything is synced)
            await supabase.from('profiles').upsert({
                id: authData.user.id,
                username: data.username,
                phone_number: data.phone,
                email: userEmail,
                full_name: data.fullName
            }, { onConflict: 'id' });

            // Force fetch profile to update context immediately
            await fetchProfile(authData.user.id);
        }
        return { error };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setUserRole(null);
    };

    const isAdmin = () => userRole === 'admin';

    const displayIdentifier = user?.email?.endsWith('@kvp.internal')
        ? (profile?.username || profile?.phone_number || "User")
        : (user?.email || null);

    const value = useMemo(() => ({
        user, profile, session, userRole, loading,
        signIn, signInWithOTP, signInWithIdentifier,
        verifyOTP, signUp, signOut, isAdmin,
        displayIdentifier
    }), [user, profile, session, userRole, loading, fetchProfile, fetchUserRole]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
