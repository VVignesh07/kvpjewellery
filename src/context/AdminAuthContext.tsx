
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session, AuthResponse } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';

interface AdminAuthContextType {
    user: User | null;
    session: Session | null;
    userRole: string | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<AuthResponse>;
    signOut: () => Promise<void>;
    isAdmin: () => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUserRole = useCallback(async (userId: string) => {
        console.log('🔐 AdminAuthContext - Fetching role for:', userId);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        try {
            const { data, error } = await supabaseAdmin
                .from('user_roles')
                .select('role')
                .eq('user_id', userId)
                .maybeSingle();

            clearTimeout(timeoutId);

            if (error) {
                console.error('🔐 AdminAuthContext - Error fetching role:', error);
                setUserRole(null);
            } else {
                console.log('🔐 AdminAuthContext - Role fetched:', data?.role);
                setUserRole(data?.role || null);
            }
        } catch (err) {
            clearTimeout(timeoutId);
            console.error('🔐 AdminAuthContext - Critical role fetch error:', err);
            setUserRole(null);
        }
    }, []);

    useEffect(() => {
        let mounted = true;

        const initSession = async () => {
            try {
                const { data: { session: currentSession } } = await supabaseAdmin.auth.getSession();
                if (!mounted) return;

                if (currentSession?.user) {
                    setSession(currentSession);
                    setUser(currentSession.user);
                    // Non-blocking role fetch to speed up initial load
                    fetchUserRole(currentSession.user.id).finally(() => {
                        if (mounted) setLoading(false);
                    });
                } else {
                    setSession(null);
                    setUser(null);
                    setUserRole(null);
                    setLoading(false);
                }
            } catch (error) {
                console.error('🔐 AdminAuthContext - Initialization error:', error);
                setLoading(false);
            }
        };

        const { data: { subscription } } = supabaseAdmin.auth.onAuthStateChange(async (event, currentSession) => {
            console.log('🔐 AdminAuthContext - Auth state changed:', event);

            if (!mounted) return;

            if (currentSession?.user) {
                setSession(currentSession);
                setUser(currentSession.user);
                // Don't await here to prevent blocking state updates
                fetchUserRole(currentSession.user.id).finally(() => {
                    if (mounted) setLoading(false);
                });
            } else {
                setSession(null);
                setUser(null);
                setUserRole(null);
                setLoading(false);
            }
        });

        initSession();

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [fetchUserRole]);

    const signIn = async (email: string, password: string) => {
        return await supabaseAdmin.auth.signInWithPassword({ email, password });
    };

    const signOut = async () => {
        try {
            await supabaseAdmin.auth.signOut();
            setUser(null);
            setSession(null);
            setUserRole(null);
        } catch (error) {
            console.error('🔐 AdminAuthContext - Signout error:', error);
        }
    };

    const isAdmin = () => userRole === 'admin';

    return (
        <AdminAuthContext.Provider value={{ user, session, userRole, loading, signIn, signOut, isAdmin }}>
            {children}
        </AdminAuthContext.Provider>
    );
};

export const useAdminAuth = () => {
    const context = useContext(AdminAuthContext);
    if (context === undefined) {
        throw new Error('useAdminAuth must be used within an AdminAuthProvider');
    }
    return context;
};
