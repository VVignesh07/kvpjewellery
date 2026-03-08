import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, MessageCircle, Share2, ArrowLeft, Check, X, Loader2, Star, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { generateProductWhatsAppUrl } from "@/lib/whatsapp";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CloudinaryImage } from "@/components/ui/CloudinaryImage";
import { Button } from "@/components/ui/button";
import RelatedProducts from "@/components/product/RelatedProducts";
import MetaTags from "@/components/seo/MetaTags";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url: string;
  images?: string[];
  description?: string;
  stock: string;
  stock_quantity?: number;
  original_price?: number;
  avg_rating?: number;
  review_count?: number;
}

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart, items } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState<string>("");
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchProduct(id);

      // Realtime subscription for this specific product
      const channel = supabase
        .channel(`product-detail-${id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'products',
            filter: `id=eq.${id}`
          },
          (payload) => {
            console.log("Realtime update received:", payload);
            setProduct((prev) => {
              if (!prev) return null;
              // Merge the new data (payload.new) with existing product data
              // payload.new contains the raw DB row, so we need to ensure types match if necessary
              // but mostly it maps 1:1 for simple fields like stock_quantity
              return { ...prev, ...payload.new as any };
            });

            // Also update main image if it changed and we are showing it
            if (payload.new.images && payload.new.images.length > 0) {
              // Optional: Logic to update image if needed, but usually stock is the main concern
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
    }
  }, [id]);

  const fetchProduct = async (productId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      toast.error("Failed to load product details");
    } else {
      setProduct(data);
      // Set initial main image
      if (data.images && data.images.length > 0) {
        setMainImage(data.images[0]);
      } else {
        setMainImage(data.image_url || '/placeholder.svg');
      }
    }
    setLoading(false);
  };

  const isOutOfStock = (product: Product) => {
    if (product.stock_quantity !== undefined) {
      return product.stock_quantity <= 0;
    }
    return product.stock === "Out of Stock";
  };

  const getStockLabel = (product: Product) => {
    if (product.stock_quantity !== undefined) {
      if (product.stock_quantity <= 0) return { text: "Out of Stock", color: "text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400" };
      return { text: "In Stock", color: "text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400" };
    }
    if (product.stock === "Out of Stock") return { text: "Out of Stock", color: "text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400" };
    return { text: "In Stock", color: "text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400" };
  };

  const handleAddToCart = () => {
    if (!user) {
      toast.error("Please login to add items to cart");
      navigate("/login", { state: { from: location } });
      return;
    }
    if (product) {
      addToCart({
        ...product,
        stock_quantity: product.stock_quantity
      } as any);
      toast.success("Added to cart");
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      toast.error("Please login to proceed to checkout");
      navigate("/login", { state: { from: location } });
      return;
    }
    if (product) {
      addToCart({
        ...product,
        stock_quantity: product.stock_quantity
      } as any);
      navigate("/checkout");
    }
  };

  // Derived properties - Declare these BEFORE early returns to avoid hook issues
  const galleryImages = product?.images && product.images.length > 0
    ? product.images
    : [product?.image_url || '/placeholder.svg'];

  const originalPrice = product?.original_price;
  const discount = originalPrice && product
    ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
    : 0;

  // Effects and methods using product data
  // Auto-slide effect
  useEffect(() => {
    if (galleryImages.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentImgIndex((prev) => (prev + 1) % galleryImages.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(timer);
  }, [galleryImages.length]);

  // Update mainImage when currentImgIndex changes
  useEffect(() => {
    if (galleryImages[currentImgIndex]) {
      setMainImage(galleryImages[currentImgIndex]);
    }
  }, [currentImgIndex, galleryImages]);

  const nextImage = () => {
    setCurrentImgIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setCurrentImgIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const shareText = product ? encodeURIComponent(`Check out ${product.name} — ₹${product.price.toLocaleString("en-IN")} at KVP JEWELLERY!`) : "";
  const shareUrl = `https://wa.me/?text=${shareText}`;

  const stockInfo = product ? getStockLabel(product) : { text: "", color: "" };
  const cartItem = items.find(i => i.product.id === product?.id);
  const isAtMaxStock = cartItem && product && cartItem.quantity >= (product.stock_quantity ?? 0);
  const disableCart = (product && isOutOfStock(product)) || isAtMaxStock || !product;

  // Early returns
  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Product not found</h2>
        <Button asChild>
          <Link to="/shop">Back to Shop</Link>
        </Button>
      </div>
    );
  }

  // Structured Data (JSON-LD) for SEO
  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.images && product.images.length > 0 ? product.images : [product.image_url],
    "description": product.description || `Buy ${product.name} at KVP JEWELLERY. Premium quality gold jewellery.`,
    "sku": product.id,
    "brand": {
      "@type": "Brand",
      "name": "KVP JEWELLERY"
    },
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "INR",
      "price": product.price,
      "availability": disableCart ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      "priceValidUntil": "2026-12-31"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": product.avg_rating || 5,
      "reviewCount": product.review_count || 1
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <MetaTags
        title={`${product.name} — Luxury Gold Jewellery | KVP`}
        description={product.description?.substring(0, 160) || `Buy handcrafted ${product.name} at KVP JEWELLERY. Premium quality gold jewellery for every occasion.`}
        image={product.image_url}
        structuredData={structuredData}
      />

      <div className="container mx-auto px-4">
        <Button
          variant="ghost"
          className="mb-8 pl-0 hover:pl-2 transition-all"
          asChild
        >
          <Link to="/shop">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shop
          </Link>
        </Button>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="group relative rounded-2xl overflow-hidden shadow-elevated aspect-square bg-card"
            >
              <CloudinaryImage
                src={mainImage}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                priority={true}
              />

              {/* Navigation Arrows */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-sm border border-border/50 flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-all hover:bg-white dark:hover:bg-black/70 hover:scale-110 z-10"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-sm border border-border/50 flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-all hover:bg-white dark:hover:bg-black/70 hover:scale-110 z-10"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}

              {/* Image Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {galleryImages.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentImgIndex ? "w-6 bg-primary" : "w-1.5 bg-white/60"}`}
                  />
                ))}
              </div>
            </motion.div>

            {/* Thumbnails */}
            {galleryImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {galleryImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImgIndex(index)}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${currentImgIndex === index ? "border-primary" : "border-transparent hover:border-primary/50"
                      }`}
                  >
                    <CloudinaryImage
                      src={img}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      width={80}
                      height={80}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6 lg:space-y-8"
          >
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-bold text-primary tracking-[0.2em] uppercase">
                  {product.category}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-5xl font-heading font-bold text-foreground leading-tight">
                {product.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-primary">₹{product.price.toLocaleString("en-IN")}</span>
                  {originalPrice && (
                    <span className="text-sm sm:text-base text-muted-foreground line-through decoration-primary/30">
                      ₹{originalPrice.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
                {originalPrice && (
                  <span className="bg-primary/10 text-primary text-[10px] sm:text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">{discount}% OFF</span>
                )}
                <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-xl border border-amber-100 dark:border-amber-800 flex-shrink-0">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-black text-amber-700 dark:text-amber-300">
                    {product.avg_rating ? Number(product.avg_rating).toFixed(1) : "5.0"}
                  </span>
                  <span className="text-xs text-amber-500/70 dark:text-amber-400/70 font-bold">({product.review_count || 0})</span>
                </div>
              </div>
              <div className="inline-block">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${stockInfo.color}`}>
                  {stockInfo.text}
                </span>
              </div>
            </div>

            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-2xl border-l-2 border-primary/20 pl-4 py-1">
              {product.description || "Indulge in the luxury of handcrafted gold jewellery, designed to make every moment special."}
            </p>

            <div className="space-y-4 pt-4">
              {/* Primary Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  size="lg"
                  className="w-full text-sm font-bold tracking-widest h-14 gradient-gold text-primary-foreground border-none shadow-gold hover:shadow-elevated transition-all rounded-full"
                  onClick={handleBuyNow}
                  disabled={disableCart}
                >
                  BUY NOW
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full text-sm font-bold tracking-widest h-14 bg-primary/5 text-primary hover:bg-primary/10 border-none transition-all rounded-full"
                  onClick={handleAddToCart}
                  disabled={disableCart}
                >
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  {isAtMaxStock ? "MAX QTY" : (disableCart ? "SOLD OUT" : "ADD TO CART")}
                </Button>
              </div>

              {/* Secondary Action Buttons */}
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full text-sm sm:text-base h-12 rounded-full"
                  onClick={() => window.open(generateProductWhatsAppUrl(product.name, product.price), '_blank')}
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Enquire on WhatsApp
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className={`h-12 w-12 rounded-full flex-shrink-0 transition-all ${isInWishlist(product.id) ? "border-primary text-primary" : ""}`}
                  onClick={() => toggleWishlist(product as any)}
                  aria-label="Add to wishlist"
                >
                  <Heart className={`h-5 w-5 ${isInWishlist(product.id) ? "fill-primary" : ""}`} />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-12 w-12 rounded-full flex-shrink-0"
                  onClick={() => window.open(shareUrl, '_blank')}
                  aria-label="Share product"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-6">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Check className="h-5 w-5 text-primary" />
                <span>Certified Quality</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Check className="h-5 w-5 text-primary" />
                <span>Secure Shipping</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Check className="h-5 w-5 text-primary" />
                <span>Lifetime Support</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Check className="h-5 w-5 text-primary" />
                <span>Easy Returns</span>
              </div>
            </div>

            {/* Product Reviews Section */}
            <div className="pt-8 border-t">
              <h3 className="text-xl font-bold mb-6">Write a Review</h3>
              <ReviewForm productId={id || ""} productName={product.name} />
            </div>
          </motion.div>
        </div>

        {/* Related Products Section (Full Width) */}
        <div className="mt-12 pt-12 border-t">
          <RelatedProducts currentProductId={product.id} category={product.category} />
        </div>
      </div>
    </div>
  );
};

// Simple Review Form Component
const ReviewForm = ({ productId, productName }: { productId: string, productName: string }) => {
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !content) {
      toast.error("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('testimonials')
        .insert([{
          name,
          content,
          rating,
          product_id: productId,
          role: "Verified Buyer",
          is_active: false // Requires admin approval
        }]);

      if (error) throw error;

      toast.success("Review submitted! It will appear after approval.");
      setName("");
      setContent("");
      setRating(5);
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-secondary/20 p-8 rounded-[2rem] border border-border/50">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Your Rating</label>
          <div className="flex gap-1.5 p-3 bg-background/50 rounded-2xl w-fit border border-border/30">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`transition-all duration-300 hover:scale-110 ${rating >= star ? "text-amber-400" : "text-muted-foreground/30"}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill={rating >= star ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-6 h-6"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          <label htmlFor="reviewer-name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Your Name</label>
          <input
            id="reviewer-name"
            className="flex h-12 w-full rounded-2xl border-none bg-background/50 px-6 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            required
          />
        </div>
      </div>

      <div className="space-y-2.5">
        <label htmlFor="review-content" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Your Experience</label>
        <textarea
          id="review-content"
          className="flex min-h-[120px] w-full rounded-2xl border-none bg-background/50 px-6 py-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all resize-none placeholder:text-muted-foreground/40"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Tell us about your ${productName}...`}
          required
          rows={3}
        />
      </div>

      <Button type="submit" disabled={submitting} className="w-full h-14 text-sm font-bold tracking-[0.2em] rounded-2xl gradient-gold text-primary-foreground shadow-gold hover:shadow-elevated transition-all duration-500">
        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        SUBMIT REVIEW
      </Button>
    </form>
  );
};

export default ProductDetail;
