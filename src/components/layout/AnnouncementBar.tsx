import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface AnnouncementSettings {
    enabled: boolean;
    text: string;
    bgColor: string;
    textColor: string;
    speed: number;
    scrollEnabled: boolean;
}

const AnnouncementBar = () => {
    const [settings, setSettings] = useState<AnnouncementSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase.from('app_settings').select('*').in('key', [
                'announcement_enabled',
                'announcement_text',
                'announcement_bg_color',
                'announcement_text_color',
                'announcement_speed',
                'announcement_scroll_enabled'
            ]);

            if (data) {
                const config: any = {};
                data.forEach(item => {
                    config[item.key] = item.value;
                });
                setSettings({
                    enabled: config.announcement_enabled,
                    text: config.announcement_text,
                    bgColor: config.announcement_bg_color || '#000000',
                    textColor: config.announcement_text_color || '#ffffff',
                    speed: Number(config.announcement_speed) || 20,
                    scrollEnabled: config.announcement_scroll_enabled !== false
                });
            }
            setLoading(false);
        };

        fetchSettings();

        // Realtime subscription using channel
        const channel = supabase
            .channel('announcement_settings')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'app_settings'
                },
                (payload) => {
                    // Refresh if any announcement setting changes
                    if (payload.new.key.startsWith('announcement_')) {
                        fetchSettings();
                    }
                }
            )
            .subscribe();

        return () => {
            if (channel) {
                const cleanup = async () => {
                    try {
                        // More aggressive check to prevent "WebSocket is closed" error
                        if (channel.state !== 'closed' && channel.state !== 'errored') {
                            supabase.removeChannel(channel).catch(() => { });
                        }
                    } catch (e) {
                        // Silent fail
                    }
                };
                cleanup();
            }
        };
    }, []);

    if (loading || !settings || !settings.enabled) return null;

    return (
        <div
            className="w-full py-2 overflow-hidden relative z-50 flex items-center justify-center font-medium text-xs sm:text-sm tracking-wide"
            style={{
                backgroundColor: settings.bgColor,
                color: settings.textColor,
                // Pass speed as a CSS variable for the animation
                '--marquee-speed': `${settings.speed}s`
            } as React.CSSProperties}
        >
            <div className={`flex items-center ${settings.scrollEnabled ? 'animate-marquee whitespace-nowrap' : 'justify-center w-full px-4 text-center'}`}>
                {settings.scrollEnabled ? (
                    /* Repeat the text 8 times to fill the screen and loop smoothly */
                    [...Array(8)].map((_, i) => (
                        <span
                            key={i}
                            onClick={() => {
                                navigator.clipboard.writeText(settings.text);
                                import("sonner").then(({ toast }) => toast.success("Announcement copied to clipboard!"));
                            }}
                            className="mx-8 font-semibold uppercase tracking-[0.2em] cursor-pointer hover:underline"
                            title="Click to copy"
                        >
                            {settings.text}
                        </span>
                    ))
                ) : (
                    <span
                        onClick={() => {
                            navigator.clipboard.writeText(settings.text);
                            import("sonner").then(({ toast }) => toast.success("Announcement copied to clipboard!"));
                        }}
                        className="font-semibold uppercase tracking-[0.2em] cursor-pointer hover:underline"
                        title="Click to copy"
                    >
                        {settings.text}
                    </span>
                )}
            </div>

            <style>
                {`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee var(--marquee-speed, 20s) linear infinite;
                    display: flex;
                    min-width: 200%;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
                `}
            </style>
        </div>
    );
};

export default AnnouncementBar;
