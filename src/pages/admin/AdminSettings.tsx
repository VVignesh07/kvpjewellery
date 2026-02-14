
import { useState, useEffect } from "react";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";

type SettingValue = string | number | boolean | null;

interface AppSetting {
    key: string;
    value: SettingValue;
    description: string;
}

const AdminSettings = () => {
    const [settings, setSettings] = useState<Record<string, SettingValue>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const { user, userRole } = useAdminAuth();

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabaseAdmin
                .from('app_settings')
                .select('*');

            if (error) throw error;

            // Convert array to object for easier handling
            const settingsMap: Record<string, SettingValue> = {};
            data?.forEach((item: AppSetting) => {
                settingsMap[item.key] = item.value;
            });

            setSettings(settingsMap);
        } catch (error) {
            console.error("Error fetching settings:", error);
            // Don't show error toast on first load if table doesn't exist yet, 
            // just let it be empty or default
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (key: string, currentValue: boolean) => {
        setSettings(prev => ({
            ...prev,
            [key]: !currentValue
        }));
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match!");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters!");
            return;
        }

        setPasswordLoading(true);
        try {
            const { error } = await supabaseAdmin.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            toast.success("Password updated successfully!");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to update password";
            toast.error("Failed to update password: " + message);
        } finally {
            setPasswordLoading(false);
        }
    };

    const saveSettings = async () => {
        setSaving(true);
        console.log('💾 Saving settings. Current user:', user?.id, 'Role:', userRole);

        try {
            // Upsert each setting
            const updates = Object.entries(settings).map(([key, value]) => ({
                key,
                value,
                updated_at: new Date().toISOString()
            }));

            console.log('📝 Upserting updates:', updates);

            const { data, error } = await supabaseAdmin
                .from('app_settings')
                .upsert(updates, { onConflict: 'key' })
                .select();

            if (error) {
                console.error('❌ Supabase error saving settings:', error);
                throw error;
            }

            console.log('✅ Settings saved successfully. Returned data:', data);
            toast.success("Settings saved successfully");
            fetchSettings(); // Refresh from DB
        } catch (error: any) {
            console.error("❌ Catch block error saving settings:", error);
            const message = error.message || "Failed to save settings";
            toast.error(`Error: ${message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">Manage global application preferences.</p>
            </div>

            {/* Password Change Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>Update your admin account password</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password (min 6 characters)"
                                required
                                minLength={6}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                required
                                minLength={6}
                            />
                        </div>
                        <Button type="submit" disabled={passwordLoading}>
                            {passwordLoading ? "Updating..." : "Update Password"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Homepage Configuration</CardTitle>
                    <CardDescription>Control what sections appear on the main landing page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex flex-col space-y-1">
                            <Label htmlFor="testimonials-toggle" className="text-base font-medium">
                                Show Testimonials Section
                            </Label>
                            <span className="text-sm text-muted-foreground">
                                Enable or disable the "What Our Customers Say" section on the home page.
                            </span>
                        </div>
                        <Switch
                            id="testimonials-toggle"
                            checked={settings['testimonials_enabled'] !== false} // Default to true if undefined
                            onCheckedChange={() => handleToggle('testimonials_enabled', settings['testimonials_enabled'] !== false)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Announcement Bar</CardTitle>
                    <CardDescription>Manage the top announcement bar on the website.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-2 border-b pb-4">
                        <div className="flex flex-col space-y-1">
                            <Label htmlFor="announcement-toggle" className="text-base font-medium">
                                Show Announcement Bar
                            </Label>
                            <span className="text-sm text-muted-foreground">
                                Enable or disable the top scrolling announcement bar.
                            </span>
                        </div>
                        <Switch
                            id="announcement-toggle"
                            checked={settings['announcement_enabled'] !== false}
                            onCheckedChange={() => handleToggle('announcement_enabled', settings['announcement_enabled'] !== false)}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2 border-b pb-4">
                        <div className="flex flex-col space-y-1">
                            <Label htmlFor="announcement-scroll-toggle" className="text-base font-medium">
                                Enable Scrolling Animation
                            </Label>
                            <span className="text-sm text-muted-foreground">
                                If disabled, the announcement will be static and centered.
                            </span>
                        </div>
                        <Switch
                            id="announcement-scroll-toggle"
                            checked={settings['announcement_scroll_enabled'] !== false}
                            onCheckedChange={() => handleToggle('announcement_scroll_enabled', settings['announcement_scroll_enabled'] !== false)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="announcement-text">Announcement Text</Label>
                        <textarea
                            id="announcement-text"
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={(settings['announcement_text'] as string) || ""}
                            onChange={(e) => setSettings(prev => ({ ...prev, announcement_text: e.target.value }))}
                            placeholder="Enter announcement text..."
                        />
                        <p className="text-xs text-muted-foreground">This text will scroll across the top of the site.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4">
                            <Label htmlFor="announcement-speed">Scrolling Speed (Seconds)</Label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    id="announcement-speed"
                                    min="5"
                                    max="60"
                                    step="1"
                                    value={Number(settings['announcement_speed']) || 20}
                                    onChange={(e) => setSettings(prev => ({ ...prev, announcement_speed: Number(e.target.value) }))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                                <span className="font-bold text-primary min-w-[3rem]">{settings['announcement_speed'] || 20}s</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Lower = Faster, Higher = Slower.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bg-color">Background Color</Label>
                            <div className="flex gap-2">
                                <div
                                    className="w-10 h-10 rounded-lg border shadow-sm flex-shrink-0"
                                    style={{ backgroundColor: (settings['announcement_bg_color'] as string) || '#000000' }}
                                />
                                <input
                                    type="color"
                                    id="bg-color"
                                    value={(settings['announcement_bg_color'] as string) || '#000000'}
                                    onChange={(e) => setSettings(prev => ({ ...prev, announcement_bg_color: e.target.value }))}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-2 py-1 text-sm cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="text-color">Text Color</Label>
                            <div className="flex gap-2">
                                <div
                                    className="w-10 h-10 rounded-lg border shadow-sm flex-shrink-0"
                                    style={{ backgroundColor: (settings['announcement_text_color'] as string) || '#ffffff' }}
                                />
                                <input
                                    type="color"
                                    id="text-color"
                                    value={(settings['announcement_text_color'] as string) || '#ffffff'}
                                    onChange={(e) => setSettings(prev => ({ ...prev, announcement_text_color: e.target.value }))}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-2 py-1 text-sm cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={saveSettings} disabled={saving} className="min-w-[120px]">
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};

export default AdminSettings;
