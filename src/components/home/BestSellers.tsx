import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, Loader2, Star, Heart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { CloudinaryImage } from "@/components/ui/CloudinaryImage";
import { useState, useEffect } from "react";

interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  category: string;
  image_url: string;
  stock: string;
  avg_rating?: number;
  review_count?: number;
}

const BestSellers = () => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBestSellers();
  }, []);

  const fetchBestSellers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .neq('stock', 'Out of Stock')
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  return (
    <section className="py-16 lg:py-24 bg-secondary">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-primary text-xs tracking-[0.3em] uppercase mb-2 font-body">Most Loved</p>
          <h2 className="font-heading text-3xl lg:text-4xl font-bold text-foreground">Best Sellers</h2>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-8 lg:gap-10">
              {products.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-500 flex flex-col h-full"
                >
                  <Link to={`/product/${product.id}`} className="block relative aspect-[4/5] sm:aspect-square overflow-hidden bg-muted/5">
                    <CloudinaryImage
                      src={product.image_url || '/placeholder.svg'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      width={600}
                      height={600}
                    />
                    <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex flex-col gap-1.5">
                      {product.original_price && product.original_price > product.price && (
                        <span className="bg-primary/90 backdrop-blur-sm text-primary-foreground text-[8px] sm:text-[9px] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full font-bold uppercase tracking-widest shadow-md border border-white/20">
                          {Math.round(((product.original_price - product.price) / product.original_price) * 100)}% OFF
                        </span>
                      )}
                    </div>

                    {/* Wishlist Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleWishlist(product as any);
                      }}
                      className="absolute top-2 right-2 sm:top-4 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 bg-white/80 dark:bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-foreground hover:bg-primary hover:text-white transition-all shadow-sm z-10"
                    >
                      <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isInWishlist(product.id) ? "fill-primary text-primary" : ""}`} />
                    </button>
                  </Link>
                  <div className="p-3 sm:p-6 flex flex-col flex-grow">
                    <Link to={`/product/${product.id}`}>
                      <h3 className="font-heading text-sm sm:text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-primary font-bold text-base sm:text-xl">₹{product.price.toLocaleString("en-IN")}</span>
                        {product.original_price && product.original_price > product.price && (
                          <span className="text-xs text-muted-foreground line-through opacity-60">₹{product.original_price.toLocaleString("en-IN")}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded-lg border border-amber-100/50 dark:border-amber-800/50">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-[11px] font-black text-amber-700 dark:text-amber-300">
                          {product.avg_rating ? Number(product.avg_rating).toFixed(1) : "5.0"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-auto">
                      <button
                        onClick={() => {
                          const isAvailable = product.stock !== "Out of Stock";
                          if (!isAvailable) return;

                          addToCart({
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            image: product.image_url,
                            category: product.category,
                            inStock: isAvailable,
                            description: "",
                            images: [product.image_url],
                            original_price: product.original_price,
                            stock_quantity: (product as any).stock_quantity
                          });
                          toast.success(`${product.name} added to cart`);
                        }}
                        disabled={product.stock === "Out of Stock"}
                        className="w-full flex items-center justify-center gap-3 py-3 rounded-full border border-border text-foreground text-sm font-bold tracking-wide hover:gradient-gold hover:text-primary-foreground hover:border-transparent transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed uppercase"
                      >
                        {product.stock === "Out of Stock" ? "Sold Out" : "Add to Cart"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link
                to="/shop"
                className="inline-flex items-center px-8 py-3 rounded-full border border-primary text-primary font-medium text-sm tracking-wide hover:gradient-gold hover:text-primary-foreground hover:border-transparent transition-all duration-300"
              >
                View All Products
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default BestSellers;
