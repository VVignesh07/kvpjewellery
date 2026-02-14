import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, ShoppingBag, DollarSign, TrendingUp, Loader2, Star, Clock, BarChart3, Calendar } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell } from "recharts";

import { LucideIcon } from "lucide-react";

interface KPIStat {
    title: string;
    value: string;
    description: string;
    icon: LucideIcon;
    color: string;
    bgColor: string;
}

interface SalesData {
    name: string;
    revenue: number;
    orders: number;
}

interface CategoryData {
    name: string;
    revenue: number;
    count: number;
}

interface RecentOrder {
    id: string;
    order_number: string;
    total_amount: number;
    created_at: string;
    status: string;
}

const AdminAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<KPIStat[]>([]);
    const [chartData, setChartData] = useState<SalesData[]>([]);
    const [categoryStats, setCategoryStats] = useState<CategoryData[]>([]);
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            // 1. Fetch KPI Stats
            const { data: dashboardStats, error: statsError } = await supabaseAdmin.rpc('get_admin_dashboard_stats');
            if (statsError) throw statsError;

            // 2. Fetch Sales Trend (Last 7 Days)
            const { data: salesData, error: salesError } = await supabaseAdmin.rpc('get_sales_chart_data', { days_count: 7 });
            if (salesError) throw salesError;

            // 3. Fetch Category Performance
            const { data: catStats, error: catError } = await supabaseAdmin.rpc('get_category_stats');
            if (catError) throw catError;

            // 4. Fetch Recent Orders for Context
            const { data: orders, error: ordersError } = await supabaseAdmin
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);
            if (ordersError) throw ordersError;

            setStats([
                {
                    title: "Total Revenue",
                    value: `₹${(dashboardStats.totalRevenue || 0).toLocaleString("en-IN")}`,
                    description: "Net lifetime sales",
                    icon: DollarSign,
                    color: "text-emerald-600",
                    bgColor: "bg-emerald-100/50",
                },
                {
                    title: "Orders Done",
                    value: dashboardStats.totalOrders.toString(),
                    description: "Total orders processed",
                    icon: ShoppingBag,
                    color: "text-blue-600",
                    bgColor: "bg-blue-100/50",
                },
                {
                    title: "Live Products",
                    value: dashboardStats.totalProducts.toString(),
                    description: "Items in inventory",
                    icon: Package,
                    color: "text-amber-600",
                    bgColor: "bg-amber-100/50",
                },
                {
                    title: "Total Customers",
                    value: dashboardStats.totalUsers.toString(),
                    description: "Registered members",
                    icon: Users,
                    color: "text-purple-600",
                    bgColor: "bg-purple-100/50",
                },
            ]);

            setChartData(salesData.map((d: any) => ({
                name: new Date(d.day).toLocaleDateString('en-IN', { weekday: 'short' }),
                revenue: Number(d.revenue),
                orders: Number(d.count)
            })));

            setCategoryStats(catStats.map((c: any) => ({
                name: c.category || "General",
                revenue: Number(c.total_revenue),
                count: Number(c.product_count)
            })));

            setRecentOrders(orders || []);

        } catch (error) {
            console.error("Analytics Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#d97706', '#059669', '#2563eb', '#7c3aed', '#db2777'];

    return (
        <div className="space-y-8 pb-10 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1 text-left">
                    <h2 className="text-4xl font-black tracking-tight text-gray-900">
                        Admin <span className="text-amber-600">Analytics</span>
                    </h2>
                    <p className="text-gray-500 font-medium text-lg">
                        Deep insights into your store performance and sales growth.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchAnalytics()}
                        className="bg-white hover:bg-gray-50 text-gray-900 px-6 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-gray-200/50 border border-gray-100 transition-all flex items-center gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> : <Clock className="w-4 h-4 text-amber-500" />}
                        Refresh Data
                    </button>
                </div>
            </div>

            {/* KPI Stats */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="border-none shadow-xl shadow-gray-200/50 overflow-hidden group hover:scale-[1.02] transition-all duration-300 rounded-[2rem]">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-black text-gray-400 uppercase tracking-widest text-left">
                                    {stat.title}
                                </CardTitle>
                                <div className={`p-2.5 rounded-xl ${stat.bgColor} transition-transform group-hover:rotate-12 duration-300`}>
                                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent className="text-left">
                                <div className="text-3xl font-black text-gray-900 mb-1 tracking-tighter">
                                    {loading ? "..." : stat.value}
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                    {stat.description}
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Revenue Trend Chart */}
                <Card className="border-none shadow-2xl shadow-gray-200/50 rounded-[2.5rem] overflow-hidden bg-white">
                    <CardHeader className="p-8 pb-0">
                        <div className="flex items-center justify-between">
                            <div className="text-left">
                                <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                                    Revenue <span className="text-emerald-600">Growth</span>
                                </CardTitle>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">LAST 7 DAYS PERFORMANCE</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 h-[350px]">
                        {loading ? (
                            <div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-amber-500" /></div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 800 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 800 }}
                                        tickFormatter={(val) => `₹${val}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)' }}
                                        itemStyle={{ fontWeight: 'black' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#10b981"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Category Sales Bar Chart */}
                <Card className="border-none shadow-2xl shadow-gray-200/50 rounded-[2.5rem] overflow-hidden bg-white">
                    <CardHeader className="p-8 pb-0">
                        <div className="text-left">
                            <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-amber-500" />
                                Category <span className="text-amber-600">Sales</span>
                            </CardTitle>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">REVENUE CONTRIBUTION BY PIECE TYPE</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 h-[350px]">
                        {loading ? (
                            <div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-amber-500" /></div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryStats}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 800 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)' }}
                                    />
                                    <Bar dataKey="revenue" radius={[10, 10, 0, 0]} barSize={40}>
                                        {categoryStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Section: Recent Orders Summary */}
            <Card className="border-none shadow-2xl shadow-gray-200/50 rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="p-8 border-b border-gray-50">
                    <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-amber-500" />
                        Recent <span className="text-amber-600">Sales</span> Velocity
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                        {recentOrders.map((order, idx) => (
                            <div key={order.id} className="p-5 rounded-3xl bg-gray-50 border border-gray-100 group hover:bg-amber-50/50 hover:border-amber-100 transition-all text-left">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                                        <Package className="w-4 h-4 text-amber-600" />
                                    </div>
                                    <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full uppercase">
                                        {order.status}
                                    </span>
                                </div>
                                <p className="text-sm font-black text-gray-900 group-hover:text-amber-700 transition-colors">#{order.order_number}</p>
                                <p className="text-lg font-black text-gray-900 mt-1">₹{Number(order.total_amount).toLocaleString()}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase mt-2">{new Date(order.created_at).toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>
                    {recentOrders.length === 0 && !loading && (
                        <div className="py-12 text-center text-gray-400 font-bold">No recent sales data available.</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminAnalytics;
