import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { useAdminAuth } from './AdminAuthContext';
import { toast } from 'sonner';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    link?: string;
    metadata?: Record<string, unknown>;
    created_at: string;
}

interface AdminNotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    clearAll: () => Promise<void>;
}

const AdminNotificationContext = createContext<AdminNotificationContextType | undefined>(undefined);

export const AdminNotificationProvider = ({ children }: { children: ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, userRole } = useAdminAuth();



    const playNotificationSound = () => {
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioContextClass();

            // Create a professional "chime" sound
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
            oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5); // A4

            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.8);
        } catch (err) {
            console.error('Could not play notification sound:', err);
        }
    };

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user || userRole !== 'admin') return;

            try {
                const { data, error } = await supabaseAdmin
                    .from('notifications')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (error) throw error;
                setNotifications(data || []);
            } catch (err) {
                console.error('Error fetching notifications:', err);
            } finally {
                setLoading(false);
            }
        };

        if (user && userRole === 'admin') {
            fetchNotifications();

            // Real-time subscription
            const channel = supabaseAdmin
                .channel('admin-notifications-sync')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications'
                    },
                    (payload) => {
                        const newNotification = payload.new as Notification;
                        setNotifications((prev) => [newNotification, ...prev].slice(0, 20));

                        // Show toast and play sound for new orders
                        if (newNotification.type === 'order') {
                            // Play the chime sound
                            playNotificationSound();

                            toast.success(newNotification.title, {
                                description: newNotification.message,
                                duration: 10000,
                            });
                        }
                    }
                )
                .subscribe();

            return () => {
                if (channel) {
                    const cleanup = async () => {
                        try {
                            // Only attempt to remove if the channel isn't already closed or errored
                            if (channel.state !== 'closed' && channel.state !== 'errored') {
                                await supabaseAdmin.removeChannel(channel).catch((err) => {
                                    // Ignore errors during channel removal (e.g. already closed)
                                    console.log('📦 Realtime cleanup info:', err.message || err);
                                });
                            }
                        } catch (e) {
                            // Silent fail for unexpected cleanup issues
                        }
                    };
                    cleanup();
                }
            };
        }
    }, [user, userRole]);

    const markAsRead = async (id: string) => {
        try {
            const { error } = await supabaseAdmin
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (error) throw error;
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            const { error } = await supabaseAdmin
                .from('notifications')
                .update({ is_read: true })
                .eq('is_read', false);

            if (error) throw error;
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    const clearAll = async () => {
        try {
            const { error } = await supabaseAdmin
                .from('notifications')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

            if (error) throw error;
            setNotifications([]);
        } catch (err) {
            console.error('Error clearing notifications:', err);
        }
    };

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    const value = useMemo(() => ({
        notifications, unreadCount, loading, markAsRead, markAllAsRead, clearAll
    }), [notifications, unreadCount, loading]);

    return (
        <AdminNotificationContext.Provider value={value}>
            {children}
        </AdminNotificationContext.Provider>
    );
};

export const useAdminNotifications = () => {
    const context = useContext(AdminNotificationContext);
    if (context === undefined) {
        throw new Error('useAdminNotifications must be used within an AdminNotificationProvider');
    }
    return context;
};
