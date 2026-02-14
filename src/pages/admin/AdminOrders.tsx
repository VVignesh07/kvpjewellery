import { useEffect, useState, useMemo } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Package,
    Phone,
    MapPin,
    Search,
    Filter,
    Eye,
    Calendar,
    CreditCard,
    User,
    ShoppingBag,
    Trash2,
    Loader2,
    Clock,
    CheckCircle2,
    Truck
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { generateCustomerWhatsAppUrl, generateOrderConfirmationUrl } from "@/lib/whatsapp";
import { MessageCircle as MsgCircle } from "lucide-react";

interface OrderItem {
    id: string;
    product_name: string;
    product_image: string;
    quantity: number;
    price: number;
}

interface Order {
    id: string;
    order_number: string;
    total_amount: number;
    status: string;
    payment_method: string;
    shipping_fee?: number;
    created_at: string;
    shipping_address: {
        name: string;
        phone: string;
        address: string;
    };
    order_items: OrderItem[];
    tracking_number?: string;
    tracking_url?: string;
}

const statusThemes = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    pending_payment: "bg-orange-100 text-orange-700 border-orange-200",
    processing: "bg-blue-100 text-blue-700 border-blue-200",
    shipped: "bg-purple-100 text-purple-700 border-purple-200",
    delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
    cancelled: "bg-rose-100 text-rose-700 border-rose-200",
};

const ORDERS_PER_PAGE = 50;

const AdminOrders = () => {
    const { loading: authLoading } = useAdminAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

    // Tracking info state
    const [trackingNumber, setTrackingNumber] = useState("");
    const [trackingUrl, setTrackingUrl] = useState("");
    const [savingTracking, setSavingTracking] = useState(false);

    useEffect(() => {
        if (!authLoading) {
            fetchOrders();

            // REALTIME: Listen for new orders or status updates
            const channel = supabaseAdmin
                .channel('admin-orders-realtime')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'orders'
                    },
                    (payload) => {
                        console.log('📦 Realtime order event:', payload);
                        fetchOrders();
                    }
                )
                .subscribe();

            return () => {
                if (channel) {
                    const cleanup = async () => {
                        try {
                            if (channel.state !== 'closed' && channel.state !== 'errored') {
                                await supabaseAdmin.removeChannel(channel).catch(() => { });
                            }
                        } catch (e) {
                            // Silent fail
                        }
                    };
                    cleanup();
                }
            };
        }
    }, [authLoading]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabaseAdmin
                .from("orders")
                .select(`*, order_items(*)`)
                .order("created_at", { ascending: false })
                .limit(ORDERS_PER_PAGE);

            if (error) throw error;
            setOrders(data as Order[]);
        } catch (error) {
            console.error("Failed to load orders", error);
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTracking = async () => {
        if (!selectedOrder) return;

        try {
            setSavingTracking(true);
            const { error } = await supabaseAdmin
                .from("orders")
                .update({
                    tracking_number: trackingNumber,
                    tracking_url: trackingUrl
                })
                .eq("id", selectedOrder.id);

            if (error) throw error;

            toast.success("Tracking information updated");

            // Update local state
            setOrders(prev => prev.map(o =>
                o.id === selectedOrder.id
                    ? { ...o, tracking_number: trackingNumber, tracking_url: trackingUrl }
                    : o
            ));

            // Update selected order in dialog
            setSelectedOrder(prev => prev ? { ...prev, tracking_number: trackingNumber, tracking_url: trackingUrl } : null);

        } catch (error) {
            console.error("Tracking update error:", error);
            toast.error("Failed to update tracking info");
        } finally {
            setSavingTracking(false);
        }
    };

    const filteredOrders = useMemo(() => {
        let filtered = orders;
        if (statusFilter !== "all") {
            filtered = filtered.filter((order) => order.status === statusFilter);
        }
        if (searchTerm) {
            filtered = filtered.filter(
                (order) =>
                    order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    order.shipping_address?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    order.shipping_address?.phone?.includes(searchTerm)
            );
        }
        return filtered;
    }, [orders, searchTerm, statusFilter]);

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            const { error } = await supabaseAdmin
                .from("orders")
                .update({ status: newStatus })
                .eq("id", orderId);

            if (error) throw error;
            toast.success("Order status refined");
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        } catch (error) {
            console.error("Status update error:", error);
            toast.error("Status update failed");
        }
    };

    const handleDeleteConfirm = async () => {
        if (!orderToDelete) return;
        try {
            const { error } = await supabaseAdmin
                .from("orders")
                .delete()
                .eq("id", orderToDelete);

            if (error) throw error;
            toast.success("Order removed from records");
            setOrders(prev => prev.filter(o => o.id !== orderToDelete));
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Delete failed");
        } finally {
            setDeleteDialogOpen(false);
            setOrderToDelete(null);
        }
    };

    return (
        <div className="space-y-8 pb-10 font-sans">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1 text-left">
                    <h2 className="text-2xl lg:text-4xl font-extrabold tracking-tight text-gray-900">
                        Order <span className="text-amber-600">Fulfillment</span>
                    </h2>
                    <p className="text-gray-500 text-sm lg:text-lg">
                        Manage customer requests and sales delivery.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-amber-100 text-amber-700 px-6 py-2 rounded-2xl font-black text-xs uppercase tracking-widest border border-amber-200 shadow-sm">
                        Total {filteredOrders.length} Orders
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-4 rounded-3xl shadow-xl shadow-gray-200/50 flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                        placeholder="Search order #, customer, or phone..."
                        className="pl-12 h-14 bg-gray-50/50 border-transparent focus:bg-white focus:ring-amber-500 rounded-2xl transition-all font-medium text-gray-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-64">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-14 rounded-2xl bg-gray-50/50 border-none focus:ring-0 font-bold text-gray-600 px-6">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-amber-500" />
                                <SelectValue placeholder="All Status" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl p-2 capitalize">
                            <SelectItem value="all" className="rounded-xl p-3 font-bold">All Orders</SelectItem>
                            {Object.keys(statusThemes).map(status => (
                                <SelectItem key={status} value={status} className="rounded-xl p-3 font-bold">
                                    {status.replace("_", " ")}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Orders List */}
            <div className="grid gap-6">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        <Card className="border-none shadow-xl shadow-gray-200/50 py-20 text-center rounded-3xl">
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Processing Transaction Ledger...</p>
                            </div>
                        </Card>
                    ) : filteredOrders.length === 0 ? (
                        <Card className="border-none shadow-xl shadow-gray-200/50 py-24 text-center rounded-3xl">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
                                <div className="p-6 bg-gray-50 rounded-full">
                                    <ShoppingBag className="w-12 h-12 text-gray-300" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">No Orders in View</h3>
                                <p className="text-sm text-gray-400 font-medium">Try refining your search or filters.</p>
                            </motion.div>
                        </Card>
                    ) : (
                        filteredOrders.map((order, index) => (
                            <motion.div
                                key={order.id}
                                layout
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className="border-none shadow-xl shadow-gray-200/50 rounded-3xl hover:shadow-2xl transition-all duration-300 group overflow-hidden">
                                    <CardContent className="p-0">
                                        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-50">
                                            {/* Order Identity info */}
                                            <div className="p-6 lg:p-8 flex-1 space-y-4">
                                                <div className="flex items-center justify-between flex-wrap gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-amber-50 text-amber-600 p-2 rounded-xl">
                                                            <Package className="h-5 w-5" />
                                                        </div>
                                                        <span className="font-mono font-black text-xl text-gray-900 tracking-tighter">
                                                            {order.order_number}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                                                        <Badge variant="outline" className={`px-3 sm:px-4 py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest border-2 ${statusThemes[order.status as keyof typeof statusThemes]}`}>
                                                            {order.status.replace("_", " ")}
                                                        </Badge>
                                                        <Badge variant="secondary" className="px-3 sm:px-4 py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-600 border-none">
                                                            {order.payment_method?.toUpperCase() || "COD"}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                                    <div className="flex items-center gap-3 text-gray-600 group-hover:text-gray-900 transition-colors">
                                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                                                            <User className="w-4 h-4 text-gray-400 group-hover:text-amber-500 transition-colors" />
                                                        </div>
                                                        <span className="text-sm font-bold">{order.shipping_address?.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-gray-600 group-hover:text-gray-900 transition-colors">
                                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                                                            <Phone className="w-4 h-4 text-gray-400 group-hover:text-amber-500 transition-colors" />
                                                        </div>
                                                        <span className="text-sm font-bold">{order.shipping_address?.phone}</span>
                                                        <a
                                                            href={generateCustomerWhatsAppUrl(order.shipping_address?.phone)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-1 hover:text-green-600 transition-colors"
                                                            title="Chat on WhatsApp"
                                                        >
                                                            <MsgCircle className="w-3.5 h-3.5" />
                                                        </a>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-gray-500">
                                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center font-bold text-[10px]">
                                                            <Calendar className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                        <span className="text-xs font-bold uppercase tracking-widest">{new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-gray-500">
                                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                                                            <CheckCircle2 className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                        <span className="text-xs font-bold uppercase tracking-widest">{order.order_items?.length || 0} ITEMS IN CART</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Order Financials & Actions */}
                                            <div className="p-6 lg:p-8 bg-gray-50/30 lg:w-80 flex flex-col justify-between gap-6">
                                                <div className="text-left lg:text-right">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 leading-none">Total Value</p>
                                                    <div className="text-2xl lg:text-4xl font-black text-gray-900 tracking-tighter">
                                                        ₹{order.total_amount.toLocaleString("en-IN")}
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 flex-wrap md:flex-nowrap">
                                                    <Select
                                                        value={order.status}
                                                        onValueChange={(value) => handleStatusChange(order.id, value)}
                                                    >
                                                        <SelectTrigger className="flex-1 min-w-[140px] h-12 rounded-xl bg-white border-2 border-gray-100 font-bold text-[10px] sm:text-xs uppercase tracking-widest focus:ring-amber-500/20">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-2xl border-none shadow-2xl p-2 capitalize">
                                                            {Object.keys(statusThemes).map(status => (
                                                                <SelectItem key={status} value={status} className="rounded-xl p-3 font-bold cursor-pointer text-xs">
                                                                    {status.replace("_", " ")}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <div className="flex gap-2 w-full sm:w-auto">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="flex-1 sm:h-12 sm:w-12 h-12 rounded-xl border-2 border-emerald-100 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-all"
                                                            title="Confirm & Notify Customer"
                                                            onClick={() => {
                                                                const url = generateOrderConfirmationUrl(
                                                                    order.order_number,
                                                                    order.shipping_address?.name || "Customer",
                                                                    order.shipping_address?.phone || ""
                                                                );
                                                                window.open(url, "_blank");
                                                            }}
                                                        >
                                                            <MsgCircle className="w-5 h-5" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="flex-1 sm:h-12 sm:w-12 h-12 rounded-xl border-2 border-gray-100 hover:bg-white hover:text-amber-600 transition-all hover:border-amber-100"
                                                            onClick={() => {
                                                                setSelectedOrder(order);
                                                                setTrackingNumber(order.tracking_number || "");
                                                                setTrackingUrl(order.tracking_url || "");
                                                                setDetailsOpen(true);
                                                            }}
                                                        >
                                                            <Eye className="w-5 h-5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="flex-1 sm:h-12 sm:w-12 h-12 rounded-xl text-rose-300 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                                            onClick={() => { setOrderToDelete(order.id); setDeleteDialogOpen(true); }}
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Premium Details Dialog */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-4xl p-0 border-none rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden shadow-2xl bg-white max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Order Details</DialogTitle>
                        <DialogDescription>
                            Comprehensive view of order summary, customer details, and tracking information.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="flex flex-col">
                            <div className="bg-gray-900 p-6 lg:p-8 text-white relative">
                                <Package className="absolute right-8 top-8 w-20 h-20 text-white/5 hidden sm:block" />
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <Badge className="bg-amber-500 text-white border-none font-black text-[10px] px-3 py-1">ORDER DETAILS</Badge>
                                        <span className="font-mono text-lg sm:text-xl tracking-widest text-gray-400"># {selectedOrder.order_number}</span>
                                    </div>
                                    <h2 className="text-2xl sm:text-4xl font-black tracking-tight">{selectedOrder.shipping_address?.name}</h2>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-gray-400 pt-2">
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4" />
                                            {selectedOrder.shipping_address?.phone}
                                            <a
                                                href={generateCustomerWhatsAppUrl(selectedOrder.shipping_address?.phone)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="ml-1 p-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all shadow-sm"
                                                title="Chat on WhatsApp"
                                            >
                                                <MsgCircle className="w-3 h-3" />
                                            </a>
                                        </div>
                                        <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> {new Date(selectedOrder.created_at).toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 grid md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                                            <MapPin className="h-3 w-3 text-amber-500" /> Delivery Address
                                        </h3>
                                        <p className="p-6 bg-gray-50 rounded-2xl text-gray-700 font-bold text-sm leading-relaxed whitespace-pre-wrap border border-gray-100 shadow-inner">
                                            {selectedOrder.shipping_address?.address}
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                                            <CreditCard className="h-3 w-3 text-amber-500" /> Payment & Status
                                        </h3>
                                        <div className="bg-gray-50 rounded-2xl p-6 space-y-3 border border-gray-100">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400 font-bold text-xs uppercase tracking-wider">Status:</span>
                                                <Badge className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${statusThemes[selectedOrder.status as keyof typeof statusThemes]}`}>
                                                    {selectedOrder.status.replace("_", " ")}
                                                </Badge>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400 font-bold text-xs uppercase tracking-wider">Method:</span>
                                                <span className="text-gray-700 font-black">{selectedOrder.payment_method?.toUpperCase()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                                            <Truck className="h-3 w-3 text-amber-500" /> Tracking Information
                                        </h3>
                                        <div className="bg-amber-50/50 rounded-2xl p-6 space-y-4 border border-amber-100 shadow-sm">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-amber-900/40 uppercase tracking-widest pl-1">Tracking Number</label>
                                                <Input
                                                    placeholder="Enter tracking ID (e.g. SF123456789)"
                                                    value={trackingNumber}
                                                    onChange={(e) => setTrackingNumber(e.target.value)}
                                                    className="h-11 bg-white border-amber-200 focus:ring-amber-500 rounded-xl"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-amber-900/40 uppercase tracking-widest pl-1">Tracking Link</label>
                                                <Input
                                                    placeholder="URL for tracking (optional)"
                                                    value={trackingUrl}
                                                    onChange={(e) => setTrackingUrl(e.target.value)}
                                                    className="h-11 bg-white border-amber-200 focus:ring-amber-500 rounded-xl"
                                                />
                                            </div>
                                            <Button
                                                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl h-11 shadow-lg shadow-amber-600/20"
                                                onClick={handleSaveTracking}
                                                disabled={savingTracking}
                                            >
                                                {savingTracking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                                Update Tracking Details
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                                        <ShoppingBag className="h-3 w-3 text-amber-500" /> Purchased Pieces
                                    </h3>
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {selectedOrder.order_items?.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm group hover:shadow-md transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden shadow-inner flex-shrink-0 group-hover:scale-110 transition-transform">
                                                        <img src={item.product_image || "/placeholder.svg"} className="w-full h-full object-cover" alt={item.product_name} />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-gray-900 text-sm leading-tight mb-1">{item.product_name}</p>
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">QTY: {item.quantity}</p>
                                                    </div>
                                                </div>
                                                <p className="font-black text-gray-900 border-l border-gray-100 pl-4 ml-4">₹{(item.price * item.quantity).toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                        <span className="text-sm font-bold text-gray-400 uppercase tracking-tighter">Subtotal</span>
                                        <span className="text-lg lg:text-xl font-black text-gray-900 tracking-tighter">₹{(selectedOrder.total_amount - (selectedOrder.shipping_fee || 0)).toLocaleString()}</span>
                                    </div>
                                    <div className="pb-4 flex items-center justify-between">
                                        <span className="text-sm font-bold text-gray-400 uppercase tracking-tighter">Shipping Fee</span>
                                        <span className="text-lg lg:text-xl font-black text-gray-900 tracking-tighter">
                                            {selectedOrder.shipping_fee === 0 ? "FREE" : `₹${selectedOrder.shipping_fee || 0}`}
                                        </span>
                                    </div>
                                    <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                                        <span className="text-lg lg:text-xl font-bold text-gray-400 uppercase tracking-tighter">Grand Total</span>
                                        <span className="text-3xl lg:text-4xl font-black text-amber-600 tracking-tighter">₹{selectedOrder.total_amount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Alert Dialog for Deletion */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="rounded-3xl border-none shadow-2xl p-8 max-w-md">
                    <AlertDialogHeader className="space-y-4">
                        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                            <Trash2 className="h-7 w-7" />
                        </div>
                        <AlertDialogTitle className="text-2xl font-black text-center text-gray-900">Remove Order Record?</AlertDialogTitle>
                        <AlertDialogDescription className="text-center font-medium text-gray-500 text-base">
                            This action is permanent and will remove the order from your transaction ledger immediately.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex gap-4 mt-8">
                        <AlertDialogCancel className="flex-1 h-14 rounded-2xl border-none bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all">
                            Keep Record
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="flex-1 h-14 rounded-2xl bg-rose-600 text-white font-bold shadow-lg shadow-rose-600/30 border-none hover:bg-rose-700 hover:translate-y-[-2px] transition-all">
                            Yes, Remove
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default AdminOrders;
