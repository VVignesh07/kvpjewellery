import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Package, ShoppingBag, Phone, Loader2, ArrowRight, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase as supabaseClient } from "@/lib/supabaseClient";
import { generateTrackingInquiryUrl } from "@/lib/whatsapp";

const WHATSAPP_NUMBER = "918825564893";

const WhatsAppLogo = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.438 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .006 5.408.003 12.046c0 2.121.54 4.192 1.588 6.079L0 24l6.117-1.605a11.803 11.803 0 005.925 1.586h.005c6.632 0 12.04-5.408 12.044-12.046a11.82 11.82 0 00-3.517-8.494" />
    </svg>
);

const WhatsAppChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<"menu" | "tracking">("menu");
    const [orderId, setOrderId] = useState("");
    const [trackingResult, setTrackingResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [isOpen, mode, trackingResult, error]);

    const handleTrackOrder = async () => {
        if (!orderId.trim()) return;
        setLoading(true);
        setError("");
        setTrackingResult(null);

        try {
            const { data, error: fetchError } = await supabaseClient
                .from("orders")
                .select("order_number, status, tracking_number, tracking_url")
                .or(`order_number.eq.${orderId.trim()},id.eq.${orderId.trim()}`)
                .single();

            if (fetchError || !data) {
                setError("Order not found. Please check your Order ID.");
            } else {
                setTrackingResult(data);
            }
        } catch (err) {
            setError("Something went wrong. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 font-sans flex flex-col items-end max-w-[calc(100vw-2rem)]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="mb-4 w-[calc(100vw-2rem)] sm:w-[380px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[70vh] sm:max-h-[550px]"
                    >
                        {/* Header */}
                        <div className="bg-[#075E54] p-4 text-white flex items-center justify-between shadow-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center p-2">
                                    <WhatsAppLogo className="w-full h-full text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">KVP JEWELLERY Support</h3>
                                    <p className="text-[10px] text-white/80 flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                        Online
                                    </p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/10 rounded-full h-8 w-8">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Chat Body */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-[#E5DDD5] space-y-4 custom-scrollbar min-h-[300px]">
                            {/* Static Greeting */}
                            <div className="flex flex-col gap-1">
                                <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[85%] text-sm text-gray-800">
                                    👋 Hi there! Welcome to **KVP JEWELLERY**. How can we help you today?
                                </div>
                                <span className="text-[10px] text-gray-500 ml-1">12:00 PM</span>
                            </div>

                            {mode === "menu" ? (
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                                    <div className="grid grid-cols-1 gap-2 pt-2">
                                        <Button
                                            onClick={() => setMode("tracking")}
                                            variant="outline"
                                            className="bg-white hover:bg-emerald-50 border-emerald-100 text-emerald-700 font-bold justify-between rounded-xl h-12 shadow-sm"
                                        >
                                            <span className="flex items-center gap-2"><Package className="w-4 h-4" /> Track My Order</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            asChild
                                            variant="outline"
                                            className="bg-white hover:bg-amber-50 border-amber-100 text-amber-700 font-bold justify-between rounded-xl h-12 shadow-sm"
                                        >
                                            <a href="/shop">
                                                <span className="flex items-center gap-2"><ShoppingBag className="w-4 h-4" /> New Collections</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </a>
                                        </Button>
                                        <Button
                                            asChild
                                            variant="outline"
                                            className="bg-white hover:bg-blue-50 border-blue-100 text-blue-700 font-bold justify-between rounded-xl h-12 shadow-sm"
                                        >
                                            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">
                                                <span className="flex items-center gap-2"><Phone className="w-4 h-4" /> Talk to Support</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </a>
                                        </Button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-50">
                                        <p className="text-sm font-bold text-gray-700 mb-3">Please enter your Order ID or tracking number:</p>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="e.g. #ORD-123456"
                                                value={orderId}
                                                onChange={(e) => setOrderId(e.target.value)}
                                                onKeyDown={(e) => e.key === "Enter" && handleTrackOrder()}
                                                className="border-gray-200 focus:ring-emerald-500 rounded-xl bg-gray-50"
                                            />
                                            <Button onClick={handleTrackOrder} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-3">
                                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-bold border border-rose-100 flex items-center justify-between">
                                            {error}
                                            <Button variant="ghost" className="h-4 w-4 p-0 text-rose-600" onClick={() => { setOrderId(""); setError(""); }}>
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    )}

                                    {trackingResult && (
                                        <div className="bg-white p-4 rounded-2xl shadow-md border-l-4 border-emerald-500 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase text-gray-400">Order Status</span>
                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-tighter">
                                                    {trackingResult.status}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-500">Order Number</p>
                                                <p className="text-sm font-black text-gray-900">{trackingResult.order_number}</p>
                                            </div>
                                            {trackingResult.tracking_number && (
                                                <div>
                                                    <p className="text-xs font-bold text-gray-500">Tracking Number</p>
                                                    <p className="text-sm font-black text-emerald-600">{trackingResult.tracking_number}</p>
                                                </div>
                                            )}
                                            {trackingResult.tracking_url ? (
                                                <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs h-10 shadow-lg shadow-emerald-600/20">
                                                    <a href={trackingResult.tracking_url} target="_blank" rel="noopener noreferrer">
                                                        Track Live Delivery
                                                    </a>
                                                </Button>
                                            ) : (
                                                <Button asChild variant="outline" className="w-full border-2 border-emerald-100 text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs h-10">
                                                    <a href={generateTrackingInquiryUrl(trackingResult.order_number)} target="_blank" rel="noopener noreferrer">
                                                        Inquire on WhatsApp
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    )}

                                    <Button onClick={() => { setMode("menu"); setOrderId(""); setTrackingResult(null); setError(""); }} variant="ghost" className="w-full hover:bg-gray-200/50 rounded-xl text-xs text-gray-500 font-bold">
                                        Back to menu
                                    </Button>
                                </motion.div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 bg-white text-center border-t border-gray-100">
                            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-emerald-600 hover:underline">
                                Powered by KVP JEWELLERY Support
                            </a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${isOpen ? 'bg-gray-800' : 'bg-[#25D366] hover:bg-[#128C7E]'}`}
            >
                {isOpen ? (
                    <motion.div initial={{ y: -5, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                        <ChevronDown className="text-white w-5 h-5" />
                    </motion.div>
                ) : (
                    <WhatsAppLogo className="text-white w-8 h-8" />
                )}
            </motion.button>
        </div>
    );
};

export default WhatsAppChatbot;
