import { useState, useEffect } from "react";
import { Search, Mail, Phone, MapPin, ShoppingBag, User, Loader2, ArrowUpRight, TrendingUp, Users as UsersIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { generateCustomerWhatsAppUrl } from "@/lib/whatsapp";
import { MessageCircle as MsgCircle } from "lucide-react";

interface Customer {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    address: string;
    totalOrders: number;
    totalSpent: number;
    lastOrderDate: string;
}

const AdminCustomers = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            // Join with profiles to get the correct identifiers
            const { data: orders, error } = await supabaseAdmin
                .from('orders')
                .select(`
                    *,
                    profiles!user_id (
                        username,
                        email,
                        phone_number,
                        full_name
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const customerMap = new Map<string, Customer>();

            orders?.forEach(order => {
                const key = order.user_id || order.phone_number;
                const profile = order.profiles;

                // Priority for name: 
                // 1. If it's a mobile login (@kvp.internal), use Username
                // 2. If it's an email login, use Email
                // 3. Fallback to order.customer_name or "Guest Patron"
                let displayName = order.customer_name || "Guest Patron";
                let displayEmail = order.email;
                let displayPhone = order.phone_number || "N/A";

                if (profile) {
                    const isInternalEmail = profile.email?.endsWith('@kvp.internal');
                    if (isInternalEmail) {
                        displayName = profile.username || displayName;
                    } else if (profile.email) {
                        displayName = profile.email;
                    }

                    displayEmail = profile.email;
                    displayPhone = profile.phone_number || displayPhone;
                }

                if (!customerMap.has(key)) {
                    customerMap.set(key, {
                        id: key,
                        name: displayName,
                        email: displayEmail,
                        phone: displayPhone,
                        address: order.address || "N/A",
                        totalOrders: 0,
                        totalSpent: 0,
                        lastOrderDate: order.created_at
                    });
                }

                const customer = customerMap.get(key)!;
                customer.totalOrders += 1;
                customer.totalSpent += order.total_amount;
            });

            setCustomers(Array.from(customerMap.values()));

        } catch (error) {
            console.error("Error fetching customers:", error);
            toast.error("Failed to load customer list");
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = customers.filter(c =>
        (c.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (c.phone || "").includes(searchQuery) ||
        (c.address?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );

    const totalRevenue = customers.reduce((acc, c) => acc + c.totalSpent, 0);

    return (
        <div className="space-y-8 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-4xl font-extrabold tracking-tight text-gray-900">
                        Client <span className="text-amber-600">Directory</span>
                    </h2>
                    <p className="text-gray-500 text-lg">
                        Manage your exclusive clientele and their purchase history.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-amber-100 text-amber-700 px-6 py-2 rounded-2xl font-black text-xs uppercase tracking-widest border border-amber-200 shadow-sm">
                        {customers.length} Patrons
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                {[
                    { title: "Total Customers", value: customers.length.toString(), icon: UsersIcon, color: "text-blue-600", bgColor: "bg-blue-50" },
                    { title: "Loyal Patrons", value: customers.filter(c => c.totalOrders > 1).length.toString(), icon: ShoppingBag, color: "text-amber-600", bgColor: "bg-amber-50" },
                    { title: "Portfolio Value", value: `₹${totalRevenue.toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-emerald-600", bgColor: "bg-emerald-50" },
                ].map((stat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                        <Card className="border-none shadow-xl shadow-gray-200/50 rounded-3xl group">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">{stat.title}</CardTitle>
                                <div className={`p-2 rounded-xl ${stat.bgColor} transition-transform group-hover:scale-110`}>
                                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black text-gray-900 tracking-tighter">{stat.value}</div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Actions Bar */}
            <div className="bg-white p-4 rounded-3xl shadow-xl shadow-gray-200/50 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                        placeholder="Search by name, phone, or address..."
                        className="pl-12 h-14 bg-gray-50/50 border-transparent focus:bg-white focus:ring-amber-500 rounded-2xl transition-all font-medium text-gray-700"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-[2rem] shadow-2xl shadow-gray-200/60 overflow-hidden border border-gray-100">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow className="border-b border-gray-100 uppercase tracking-widest">
                            <TableHead className="py-6 pl-8 text-[10px] font-black text-gray-400">Patron Information</TableHead>
                            <TableHead className="py-6 text-[10px] font-black text-gray-400">Contact Details</TableHead>
                            <TableHead className="py-6 text-[10px] font-black text-gray-400 text-center">Engagement</TableHead>
                            <TableHead className="py-6 text-[10px] font-black text-gray-400">Total Valuation</TableHead>
                            <TableHead className="py-6 pr-8 text-[10px] font-black text-gray-400 text-right">Last Interaction</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <AnimatePresence mode="popLayout">
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-24">
                                        <div className="flex flex-col items-center gap-4">
                                            <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Identifying patrons from ledger...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredCustomers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-24">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="p-6 bg-gray-50 rounded-full">
                                                <User className="h-10 w-10 text-gray-200" />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900">No Patrons Found</h3>
                                            <p className="text-sm text-gray-500">Your search did not match any customer records.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCustomers.map((customer, index) => (
                                    <motion.tr
                                        key={customer.id}
                                        layout
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="group border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                                    >
                                        <TableCell className="py-5 pl-8">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-12 w-12 border-2 border-white shadow-md ring-2 ring-gray-100 group-hover:ring-amber-200 transition-all">
                                                    <AvatarFallback className="bg-gradient-to-br from-amber-400 to-amber-600 text-white font-black text-lg">
                                                        {customer.name.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-gray-900 group-hover:text-amber-600 transition-colors">{customer.name}</span>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Platinum Tier Patron</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2 text-gray-600 font-bold text-xs">
                                                    <Phone className="h-3 w-3 text-amber-500" />
                                                    {customer.phone}
                                                    <a
                                                        href={generateCustomerWhatsAppUrl(customer.phone)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1 hover:text-green-600 transition-colors"
                                                        title="Chat on WhatsApp"
                                                    >
                                                        <MsgCircle className="w-3 h-3" />
                                                    </a>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-400 font-medium text-xs">
                                                    <MapPin className="h-3 w-3" />
                                                    <span className="truncate max-w-[200px]" title={customer.address}>
                                                        {customer.address}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5 text-center">
                                            <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-tighter">
                                                {customer.totalOrders} Purchases
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-5 font-black text-gray-900 text-lg tracking-tighter">
                                            ₹{customer.totalSpent.toLocaleString("en-IN")}
                                        </TableCell>
                                        <TableCell className="py-5 pr-8 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs font-black text-gray-900 leading-none">
                                                    {new Date(customer.lastOrderDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 italic flex items-center gap-1">
                                                    Last Order <ArrowUpRight className="h-2 w-2" />
                                                </span>
                                            </div>
                                        </TableCell>
                                    </motion.tr>
                                ))
                            )}
                        </AnimatePresence>
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default AdminCustomers;
