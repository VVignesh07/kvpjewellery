import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, SlidersHorizontal, Loader2, Star, Heart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { CloudinaryImage } from "@/components/ui/CloudinaryImage";
import MetaTags from "@/components/seo/MetaTags";

type SortOption = "latest" | "price-asc" | "price-desc";

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
}


interface Category {
  id: string;
  name: string;
  slug: string;
}

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilter = searchParams.get("category") || "all";
  const [sort, setSort] = useState<SortOption>("latest");
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    fetchData();

    // Realtime subscription for Shop page (listen to all product changes)
    const channel = supabase
      .channel('shop-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          console.log("Shop realtime update:", payload);
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
        const cleanup = async () => {
          try {
            if (channel.state !== 'closed' && channel.state !== 'errored') {
              supabase.removeChannel(channel).catch(() => { });
            }
          } catch (e) {
            // Silent fail
          }
        };
        cleanup();
      }
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;
      setProducts(productsData || []);

      // Fetch Categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Failed to load shop data");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    // Filter by exact category name match
    let list = categoryFilter === "all"
      ? products
      : products.filter((p) => p.category === categoryFilter);

    switch (sort) {
      case "price-asc":
        return [...list].sort((a, b) => a.price - b.price);
      case "price-desc":
        return [...list].sort((a, b) => b.price - a.price);
      default:
        return list;
    }
  }, [products, categoryFilter, sort]);

  const setCategory = (catName: string) => {
    if (catName === "all") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", catName);
    }
    setSearchParams(searchParams);
  };

  const isInStock = (product: Product | any) => {
    if (product.stock_quantity !== undefined) {
      return product.stock_quantity > 0;
    }
    return product.stock === "In Stock";
  };

  const seoTitle = categoryFilter !== "all"
    ? `${categoryFilter} Collection — KVP JEWELLERY`
    : "Shop Luxury Gold Jewellery — KVP JEWELLERY";

  const seoDescription = categoryFilter !== "all"
    ? `Browse our exclusive ${categoryFilter} collection. Handcrafted luxury gold jewellery at the best prices.`
    : "Discover our full collection of handcrafted gold jewellery, including earrings, rings, necklaces, and bangles.";

  return (
    <main className="min-h-screen bg-background">
      <MetaTags
        title={seoTitle}
        description={seoDescription}
      />
      {/* Header */}
      <section className="relative py-12 lg:py-16 overflow-hidden bg-[#2D1B10]">
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
              {categoryFilter !== "all" ? categoryFilter : "Shop All Jewellery"}
            </h1>
            <p className="text-lg text-white/80 font-light max-w-2xl mx-auto leading-relaxed">
              Discover our handcrafted collection of timeless elegance and contemporary design.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 lg:py-12">
        {/* Filters bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2 text-sm border border-border rounded-full px-4 py-2"
            >
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>
            <div className={`${showFilters ? "flex" : "hidden"} lg:flex flex-wrap gap-2`}>
              <button
                onClick={() => setCategory("all")}
                className={`text-xs px-4 py-2 rounded-full border transition-all ${categoryFilter === "all"
                  ? "gradient-gold text-primary-foreground border-transparent"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                  }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.name)}
                  className={`text-xs px-4 py-2 rounded-full border transition-all ${categoryFilter === cat.name
                    ? "gradient-gold text-primary-foreground border-transparent"
                    : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                    }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="text-xs border border-border rounded-full px-4 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="latest">Latest</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
          </select>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Product grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {filtered.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-500"
                >
                  <Link to={`/product/${product.id}`} className="block relative aspect-[4/5] sm:aspect-square overflow-hidden">
                    <CloudinaryImage
                      src={product.image_url || '/placeholder.svg'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                      {!isInStock(product) && (
                        <span className="bg-foreground/90 backdrop-blur-sm text-primary-foreground text-[9px] sm:text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm border border-white/10">
                          Sold Out
                        </span>
                      )}
                      {product.stock === "Low Stock" && isInStock(product) && (
                        <span className="bg-yellow-500/90 backdrop-blur-sm text-white text-[9px] sm:text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm border border-white/10">
                          Low Stock
                        </span>
                      )}
                      {product.original_price && product.original_price > product.price && (
                        <span className="bg-primary/90 backdrop-blur-sm text-primary-foreground text-[9px] sm:text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider shadow-md border border-white/10">
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
                      className="absolute top-2 right-2 sm:top-4 sm:right-4 w-8 h-8 sm:w-9 sm:h-9 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-foreground hover:bg-primary hover:text-white transition-all shadow-sm z-10"
                    >
                      <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? "fill-primary text-primary" : ""}`} />
                    </button>
                  </Link>
                  <div className="p-3 lg:p-4">
                    <Link to={`/product/${product.id}`}>
                      <h3 className="font-heading text-sm lg:text-base font-semibold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex flex-col">
                        <span className="text-primary font-bold text-sm">₹{product.price.toLocaleString("en-IN")}</span>
                        {product.original_price && product.original_price > product.price && (
                          <span className="text-[10px] text-muted-foreground line-through opacity-70">₹{product.original_price.toLocaleString("en-IN")}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded-md self-end">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        <span className="text-[10px] font-bold text-amber-700">
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
                          category: product.category,
                          inStock: isInStock(product),
                          description: product.description || "",
                          images: [product.image_url],
                          original_price: product.original_price,
                          stock_quantity: (product as any).stock_quantity ?? 10
                        });
                        toast.success(`${product.name} added to cart`);
                      }}
                      disabled={!isInStock(product)}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-full border border-border text-foreground text-xs font-medium hover:gradient-gold hover:text-primary-foreground hover:border-transparent transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      {isInStock(product) ? "Add to Cart" : "Sold Out"}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                <p className="font-heading text-lg">No products found</p>
                <p className="text-sm mt-1">Try a different category</p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default Shop;
