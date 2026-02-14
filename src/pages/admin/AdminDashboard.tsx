import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, ShoppingBag, DollarSign, TrendingUp, Loader2, Star, Clock, LucideIcon } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { motion } from "framer-motion";

interface DashboardStat {
    title: string;
    value: string;
    description: string;
    icon: LucideIcon;
    color: string;
    bgColor: string;
    trend: string;
}

interface CategoryStat {
    category: string;
    product_count: number;
    total_revenue: number;
}

interface RecentOrder {
    id: string;
    order_number: string;
    total_amount: number;
    created_at: string;
    customer_name?: string;
    profiles?: {
        username?: string;
        email?: string;
        phone_number?: string;
    };
}

const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStat[]>([
        {
            title: "Total Revenue",
            value: "₹0",
            description: "Real-time revenue tracking",
            icon: DollarSign,
            color: "text-emerald-600",
            bgColor: "bg-emerald-100/50",
            trend: "+0%",
        },
        {
            title: "Total Orders",
            value: "0",
            description: "Active orders progress",
            icon: ShoppingBag,
            color: "text-blue-600",
            bgColor: "bg-blue-100/50",
            trend: "+0%",
        },
        {
            title: "Products",
            value: "0",
            description: "Inventory items",
            icon: Package,
            color: "text-amber-600",
            bgColor: "bg-amber-100/50",
            trend: "Updated",
        },
        {
            title: "Active Users",
            value: "0",
            description: "Users in your store",
            icon: Users,
            color: "text-purple-600",
            bgColor: "bg-purple-100/50",
            trend: "Live",
        },
    ]);

    const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Parallel fetch for maximum speed
            const [statsRes, categoryRes, ordersRes] = await Promise.all([
                supabaseAdmin.rpc('get_admin_dashboard_stats'),
                supabaseAdmin.rpc('get_category_stats'),
                supabaseAdmin
                    .from('orders')
                    .select('*, order_items(*), profiles!user_id(username, email, phone_number)')
                    .order('created_at', { ascending: false })
                    .limit(5)
            ]);

            if (statsRes.data) {
                setStats([
                    {
                        title: "Total Revenue",
                        value: `₹${(statsRes.data.totalRevenue || 0).toLocaleString("en-IN")}`,
                        description: "Real-time revenue tracking",
                        icon: DollarSign,
                        color: "text-emerald-600",
                        bgColor: "bg-emerald-100/50",
                        trend: "+12%",
                    },
                    {
                        title: "Total Orders",
                        value: statsRes.data.totalOrders.toString(),
                        description: "Active orders progress",
                        icon: ShoppingBag,
                        color: "text-blue-600",
                        bgColor: "bg-blue-100/50",
                        trend: "+5%",
                    },
                    {
                        title: "Products",
                        value: statsRes.data.totalProducts.toString(),
                        description: "Inventory items",
                        icon: Package,
                        color: "text-amber-600",
                        bgColor: "bg-amber-100/50",
                        trend: "Updated",
                    },
                    {
                        title: "Active Users",
                        value: (statsRes.data.totalUsers || 0).toString(),
                        description: "Users in your store",
                        icon: Users,
                        color: "text-purple-600",
                        bgColor: "bg-purple-100/50",
                        trend: "Live",
                    },
                ]);
            }

            if (categoryRes.data) {
                setCategoryStats(categoryRes.data.slice(0, 3));
            }

            if (ordersRes.data) {
                setRecentOrders(ordersRes.data);
            }
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    return (
        <div className="space-y-6 lg:space-y-8 pb-10">
            <div className="flex flex-col gap-1 lg:gap-2">
                <h2 className="text-2xl lg:text-4xl font-extrabold tracking-tight text-gray-900">
                    Welcome back, <span className="bg-gradient-to-r from-amber-500 to-amber-700 bg-clip-text text-transparent">Admin</span>
                </h2>
                <p className="text-gray-500 text-sm lg:text-lg">
                    Here's what's happening with your store today.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="border-none shadow-xl shadow-gray-200/50 overflow-hidden group hover:shadow-2xl transition-all duration-300">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                                        {stat.title}
                                    </CardTitle>
                                    <div className={`p-2 rounded-xl ${stat.bgColor} transition-transform group-hover:scale-110 duration-300`}>
                                        <Icon className={`h-5 w-5 ${stat.color}`} />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 lg:p-6">
                                    <div className="flex flex-col">
                                        <div className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1 leading-none">
                                            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stat.value}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-emerald-500 flex items-center text-xs font-bold">
                                                <TrendingUp className="h-3 w-3 mr-1" /> {stat.trend}
                                            </span>
                                            <p className="text-xs text-gray-400 font-medium whitespace-nowrap">
                                                {stat.description}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            <div className="grid gap-6 lg:grid-cols-7">
                {/* Recent Inventory Activity */}
                <Card className="col-span-1 lg:col-span-4 border-none shadow-xl shadow-gray-200/50">
                    <CardHeader className="border-b border-gray-50 p-4 lg:p-6">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <Clock className="h-5 w-5 text-amber-500" />
                                Recent Activity
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-2 lg:p-6 lg:pt-0">
                        <div className="space-y-6">
                            {recentOrders.length > 0 ? recentOrders.map((order) => (
                                <div key={order.id} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors group">
                                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                                        <ShoppingBag className="h-6 w-6 text-gray-400 group-hover:text-amber-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-900">Order {order.order_number}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {(() => {
                                                const profile = order.profiles;
                                                if (profile) {
                                                    const isInternalEmail = profile.email?.endsWith('@kvp.internal');
                                                    return isInternalEmail ? (profile.username || order.customer_name) : (profile.email || order.customer_name);
                                                }
                                                return order.customer_name || "Guest Patron";
                                            })()} — ₹{order.total_amount.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(order.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center py-10 text-gray-400">No recent orders found.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Performance Categories */}
                <Card className="col-span-1 lg:col-span-3 border-none shadow-xl shadow-gray-200/50">
                    <CardHeader className="border-b border-gray-50 p-4 lg:p-6">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Star className="h-5 w-5 text-amber-500" />
                            Top Categories
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 lg:pt-6">
                        <div className="space-y-6">
                            {categoryStats.length > 0 ? categoryStats.map((cat, index) => {
                                // Calculate simple percentage relative to total revenue of top 3
                                const totalTopRevenue = categoryStats.reduce((sum, c) => sum + Number(c.total_revenue), 0);
                                const percentage = totalTopRevenue > 0 ? Math.round((Number(cat.total_revenue) / totalTopRevenue) * 100) : 0;

                                return (
                                    <div key={index} className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{cat.category || 'Uncategorized'}</p>
                                                <p className="text-xs text-gray-500">{cat.product_count} Items</p>
                                            </div>
                                            <p className="text-xs font-bold text-amber-600">₹{Number(cat.total_revenue).toLocaleString()}</p>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                transition={{ duration: 1, delay: index * 0.2 }}
                                                className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"
                                            />
                                        </div>
                                    </div>
                                );
                            }) : (
                                <p className="text-center py-10 text-gray-400">No category data.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;
