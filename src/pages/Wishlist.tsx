import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, Trash2, ArrowRight, ShoppingCart } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { CloudinaryImage } from "@/components/ui/CloudinaryImage";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import MetaTags from "@/components/seo/MetaTags";

const Wishlist = () => {
    const { items, removeFromWishlist } = useWishlist();
    const { addToCart } = useCart();

    const handleAddToCart = (product: any) => {
        addToCart({
            ...product,
            image: product.image_url || product.image,
            images: product.images || [product.image_url || product.image],
            inStock: product.inStock
        });
        toast.success(`${product.name} added to cart`);
    };

    return (
        <main className="min-h-screen bg-background pb-16">
            <MetaTags
                title="My Wishlist — KVP JEWELLERY"
                description="View and manage your favorite handcrafted jewellery pieces."
            />

            {/* Header */}
            <section className="relative py-12 lg:py-16 overflow-hidden bg-[#2D1B10] mb-12">
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
                            My Wishlist
                        </h1>
                        <p className="text-lg text-white/80 font-light max-w-2xl mx-auto leading-relaxed">
                            Your favorite pieces, saved for later.
                        </p>
                    </motion.div>
                </div>
            </section>

            <div className="container mx-auto px-4">

                {items.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-md mx-auto text-center py-20 bg-muted/30 rounded-[2rem] border border-dashed border-border"
                    >
                        <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <Heart className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Your wishlist is empty</h2>
                        <p className="text-muted-foreground text-sm mb-8 px-10">
                            Explore our collections and save the pieces you love most.
                        </p>
                        <Link to="/shop">
                            <Button className="gradient-gold text-primary-foreground rounded-full px-8 py-6 font-bold tracking-wide">
                                START SHOPPING
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
                        <AnimatePresence mode="popLayout">
                            {items.map((product) => (
                                <motion.div
                                    key={product.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="group bg-card rounded-3xl overflow-hidden border border-border shadow-soft hover:shadow-elevated transition-all duration-500"
                                >
                                    {/* Image Container */}
                                    <div className="relative aspect-square overflow-hidden bg-muted/10">
                                        <Link to={`/product/${product.id}`}>
                                            <CloudinaryImage
                                                src={product.image_url || '/placeholder.svg'}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                width={600}
                                                height={600}
                                            />
                                        </Link>
                                        <button
                                            onClick={() => removeFromWishlist(product.id)}
                                            className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                        {!product.inStock && (
                                            <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
                                                <span className="bg-foreground text-primary-foreground text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest">
                                                    Sold Out
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="p-5 flex flex-col">
                                        <Link to={`/product/${product.id}`}>
                                            <h3 className="font-heading font-bold text-lg mb-1 group-hover:text-primary transition-colors line-clamp-1">
                                                {product.name}
                                            </h3>
                                        </Link>
                                        <p className="text-primary font-black text-xl mb-6">₹{product.price.toLocaleString("en-IN")}</p>

                                        <div className="mt-auto space-y-3">
                                            <Button
                                                onClick={() => handleAddToCart(product)}
                                                disabled={!product.inStock}
                                                className="w-full rounded-2xl h-12 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 font-bold tracking-wide uppercase text-xs"
                                                variant="outline"
                                            >
                                                <ShoppingCart className="w-4 h-4 mr-2" />
                                                Add to Cart
                                            </Button>
                                            <Link to={`/product/${product.id}`} className="block">
                                                <Button
                                                    variant="ghost"
                                                    className="w-full rounded-2xl h-12 text-muted-foreground hover:text-foreground hover:bg-muted/50 text-xs font-bold uppercase tracking-widest"
                                                >
                                                    View Details
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </main>
    );
};

export default Wishlist;
