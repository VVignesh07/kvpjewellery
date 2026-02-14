
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Package, User, Settings, LogOut } from "lucide-react";
import { toast } from "sonner";
import { OrderCard, Order } from "@/components/profile/OrderCard";
import { OrderTracking } from "@/components/profile/OrderTracking";

const Profile = () => {
    const { user, profile, signOut, loading: authLoading, displayIdentifier } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [trackingOpen, setTrackingOpen] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            const timer = setTimeout(() => {
                navigate("/login");
            }, 500);
            return () => clearTimeout(timer);
        }

        // EAGER FETCH: Start fetching as soon as we have a user ID, 
        // don't wait for authLoading (role check) to finish.
        if (user) {
            fetchOrders();

            // REALTIME: Listen for new orders or status updates
            const channel = supabase
                .channel(`user-orders-${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'orders',
                        filter: `user_id=eq.${user.id}`
                    },
                    (payload) => {
                        console.log('📦 Realtime order update:', payload);
                        fetchOrders(); // Refetch to get items joined
                    }
                )
                .subscribe();

            return () => {
                if (channel) {
                    const cleanup = async () => {
                        try {
                            if (channel.state !== 'closed' && channel.state !== 'errored') {
                                await supabase.removeChannel(channel).catch(() => { });
                            }
                        } catch (e) {
                            // Silent fail
                        }
                    };
                    cleanup();
                }
            };
        }
    }, [user?.id, authLoading]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            if (!user) {
                console.log('⚠️ fetchOrders called but no user available');
                return;
            }

            console.log('📦 Fetching orders for user:', user.id);
            const { data, error } = await supabase
                .from('orders')
                .select(`
          *,
          order_items(*)
        `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ Error fetching orders:', error);
                throw error;
            }

            console.log('✅ Orders fetched successfully:', data?.length || 0, 'orders');
            console.log('📋 Order data:', data);

            // Transform data to match Order interface if needed, or cast if it matches
            setOrders(data as Order[]);
        } catch (error: any) {
            console.error('❌ Error in fetchOrders:', error);
            // Don't show error toast if it's just empty orders
        } finally {
            setLoading(false);
        }
    };

    const handleTrackOrder = (order: Order) => {
        setSelectedOrder(order);
        setTrackingOpen(true);
    };

    const handleLogout = async () => {
        await signOut();
        toast.success("Logged out successfully");
        navigate("/");
    };

    if (authLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <section className="relative py-12 lg:py-16 overflow-hidden bg-[#2D1B10] mb-8">
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                {/* Decorative Accents */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>

                <div className="container mx-auto px-4 relative z-10 text-center text-white">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="font-heading text-4xl lg:text-6xl font-bold mb-4 tracking-tight">
                            Personal Profile
                        </h1>
                        <p className="text-lg text-white/80 font-light max-w-2xl mx-auto leading-relaxed">
                            Manage your orders and account settings with elegance.
                        </p>
                    </motion.div>
                </div>
            </section>

            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Sidebar / Mobile Tabs */}
                    <div className="w-full md:w-64 flex-shrink-0">
                        <Card className="border-border/60">
                            <CardContent className="p-6 text-center">
                                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl font-bold text-primary">
                                        {(displayIdentifier || 'U').charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <h2 className="font-bold text-lg truncate" title={displayIdentifier || ''}>{displayIdentifier}</h2>
                                <p className="text-sm text-muted-foreground">Member</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        <Tabs defaultValue="orders" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 mb-8">
                                <TabsTrigger value="orders">
                                    <Package className="w-4 h-4 mr-2" />
                                    Requests
                                </TabsTrigger>
                                <TabsTrigger value="account">
                                    <User className="w-4 h-4 mr-2" />
                                    Account
                                </TabsTrigger>
                                <TabsTrigger value="settings">
                                    <Settings className="w-4 h-4 mr-2" />
                                    Settings
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="orders" className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">My Orders</h2>
                                    <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading}>
                                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Refresh
                                    </Button>
                                </div>

                                {loading ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    </div>
                                ) : orders.length > 0 ? (
                                    <div className="grid gap-6">
                                        {orders.map((order) => (
                                            <OrderCard
                                                key={order.id}
                                                order={order}
                                                onTrackOrder={handleTrackOrder}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <Card>
                                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                            <Package className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                                            <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                                            <p className="text-muted-foreground mb-6">You haven't placed any orders yet.</p>
                                            <Button onClick={() => navigate("/shop")}>Start Shopping</Button>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            <TabsContent value="account">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Account Details</CardTitle>
                                        <CardDescription>Manage your account information.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="identifier">Account ID</Label>
                                            <Input id="identifier" value={displayIdentifier || ''} disabled />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="fullname">Full Name</Label>
                                            <Input id="fullname" value={profile?.full_name || ''} disabled />
                                        </div>
                                        {profile?.phone_number && (
                                            <div className="space-y-2">
                                                <Label htmlFor="phone">Phone Number</Label>
                                                <Input id="phone" value={profile.phone_number} disabled />
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="settings">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Settings</CardTitle>
                                        <CardDescription>Manage your app preferences.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="pt-4">
                                            <Button variant="destructive" className="w-full sm:w-auto" onClick={handleLogout}>
                                                <LogOut className="w-4 h-4 mr-2" />
                                                Log Out
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>

                <OrderTracking
                    order={selectedOrder}
                    open={trackingOpen}
                    onOpenChange={setTrackingOpen}
                />
            </div>
        </div>
    );
};

export default Profile;
