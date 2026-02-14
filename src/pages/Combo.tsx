import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, Loader2, Star, Sparkles } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { CloudinaryImage } from "@/components/ui/CloudinaryImage";

interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    image_url: string;
    description?: string;
    stock: string;
    original_price?: number;
    avg_rating?: number;
    review_count?: number;
    stock_quantity?: number;
}

const Combo = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();

    useEffect(() => {
        fetchCombos();
        document.title = "Exclusive Combos — KVP JEWELLERY";

        // Realtime subscription for combos
        const channel = supabase
            .channel('combo-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'products',
                    filter: `category=eq.Combo`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setProducts(prev => [payload.new as Product, ...prev]);
                    } else if (payload.eventType === 'DELETE') {
                        setProducts(prev => prev.filter(p => p.id !== payload.old.id));
                    } else if (payload.eventType === 'UPDATE') {
                        setProducts(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new as any } : p));
                    }
                }
            )
            .subscribe();

        return () => {
            if (channel) {
                // Safer cleanup to avoid "WebSocket is closed" errors
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
    }, []);

    const fetchCombos = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('category', 'Combo')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching combos:', error);
            toast.error("Failed to load combo deals");
        } finally {
            setLoading(false);
        }
    };

    const isInStock = (product: Product) => {
        return (product.stock_quantity ?? 0) > 0 || product.stock === "In Stock" || product.stock === "Low Stock";
    };

    return (
        <main className="min-h-screen bg-background">
            {/* Hero Section - Solid Premium Brown */}
            <section className="relative py-20 lg:py-24 overflow-hidden bg-[#2D1B10]">
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                {/* Decorative Accents */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>

                <div className="container mx-auto px-4 relative">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-3xl mx-auto text-center"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-6">
                            <Sparkles className="w-3.5 h-3.5" />
                            Value Bundles
                        </div>
                        <h1 className="font-heading text-4xl lg:text-6xl font-bold text-white mb-6">
                            Exclusive <span className="text-primary">Combo</span> Deals
                        </h1>
                        <p className="text-white/70 text-lg lg:text-xl font-light leading-relaxed">
                            Perfectly curated jewellery sets designed to elevate your elegance while offering exceptional value.
                        </p>
                    </motion.div>
                </div>
            </section>

            <div className="container mx-auto px-4 py-12">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-muted-foreground animate-pulse">Curating your perfect sets...</p>
                    </div>
                ) : (
                    <>
                        {products.length > 0 ? (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                                {products.map((product, i) => (
                                    <motion.div
                                        key={product.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="group bg-card rounded-2xl md:rounded-[2rem] overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-500 shadow-sm hover:shadow-xl"
                                    >
                                        <Link to={`/product/${product.id}`} className="block relative aspect-[4/5] overflow-hidden">
                                            <CloudinaryImage
                                                src={product.image_url || '/placeholder.svg'}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                            <div className="absolute top-2 left-2 md:top-4 md:left-4 flex flex-col gap-1 md:gap-2">
                                                {!isInStock(product) && (
                                                    <span className="bg-foreground text-primary-foreground text-[8px] md:text-[10px] px-2 py-0.5 md:px-3 md:py-1 rounded-full font-bold uppercase tracking-wider shadow-lg">
                                                        Sold Out
                                                    </span>
                                                )}
                                                {product.original_price && product.original_price > product.price && (
                                                    <span className="bg-primary text-primary-foreground text-[8px] md:text-[10px] px-2 py-0.5 md:px-3 md:py-1 rounded-full font-bold uppercase tracking-wider shadow-lg">
                                                        Best Value
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                        <div className="p-3.5 md:p-5 lg:p-6">
                                            <Link to={`/product/${product.id}`}>
                                                <h3 className="font-heading text-sm md:text-base lg:text-lg font-bold text-foreground mb-1 md:mb-2 group-hover:text-primary transition-colors line-clamp-1">
                                                    {product.name}
                                                </h3>
                                            </Link>

                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 md:mb-4 gap-1 sm:gap-0">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-primary font-bold text-base md:text-lg">₹{product.price.toLocaleString("en-IN")}</span>
                                                    {product.original_price && product.original_price > product.price && (
                                                        <span className="text-[10px] md:text-xs text-muted-foreground line-through opacity-60 italic">₹{product.original_price.toLocaleString("en-IN")}</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg w-fit">
                                                    <Star className="w-2.5 h-2.5 md:w-3 h-3 fill-amber-400 text-amber-400" />
                                                    <span className="text-[10px] md:text-xs font-bold text-amber-700">
                                                        {product.avg_rating ? Number(product.avg_rating).toFixed(1) : "5.0"}
                                                    </span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    if (!isInStock(product)) return;
                                                    addToCart({
                                                        id: product.id,
                                                        name: product.name,
                                                        price: product.price,
                                                        image: product.image_url,
                                                        category: "necklaces", // Placeholder for logic
                                                        inStock: isInStock(product),
                                                        description: product.description || "",
                                                        images: [product.image_url],
                                                        original_price: product.original_price,
                                                        stock_quantity: product.stock_quantity ?? 10
                                                    });
                                                    toast.success(`${product.name} added to cart`);
                                                }}
                                                disabled={!isInStock(product)}
                                                className="w-full flex items-center justify-center gap-1.5 md:gap-2 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-border text-foreground text-[10px] sm:text-sm font-semibold hover:gradient-gold hover:text-primary-foreground hover:border-transparent transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed group/btn"
                                            >
                                                <ShoppingBag className="w-3.5 h-3.5 md:w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                                <span className="hidden sm:inline">{isInStock(product) ? "Add Bundle to Cart" : "Currently Unavailable"}</span>
                                                <span className="sm:hidden">{isInStock(product) ? "Add to Cart" : "Unavailable"}</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="max-w-md mx-auto text-center py-24 px-6 bg-muted/30 rounded-[3rem] border border-dashed border-border">
                                <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-6" />
                                <h3 className="font-heading text-xl font-bold mb-3">No Combos Available</h3>
                                <p className="text-muted-foreground mb-8">
                                    We're currently curating new exclusive bundles for you. Check back soon for amazing deals!
                                </p>
                                <Link to="/shop" className="inline-flex items-center justify-center px-8 py-3 rounded-full gradient-gold text-primary-foreground font-bold transition-all hover:scale-105">
                                    Browse Shop
                                </Link>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
};

export default Combo;
