import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Trash2, Plus, Minus, ShoppingBag, MessageCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { generateWhatsAppOrderUrl } from "@/lib/whatsapp";
import { toast } from "sonner";
import MetaTags from "@/components/seo/MetaTags";

const Cart = () => {
  const { items, updateQuantity, removeFromCart, totalAmount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Your Cart is Empty</h1>
          <p className="text-muted-foreground text-sm mb-6">Discover our beautiful jewellery collection</p>
          <Link
            to="/shop"
            className="inline-flex items-center px-8 py-3 rounded-full gradient-gold text-primary-foreground font-medium text-sm shadow-gold"
          >
            Shop Now
          </Link>
        </div>
      </main>
    );
  }

  const shippingFee = totalAmount > 500 ? 0 : 50;
  const grandTotal = totalAmount + shippingFee;

  const quickWhatsAppUrl = generateWhatsAppOrderUrl({
    products: items.map((item) => ({
      name: item.product.name,
      price: item.product.price * item.quantity,
      quantity: item.quantity,
    })),
    total: grandTotal,
    shippingFee: shippingFee,
    customerName: "[Your Name]",
    customerPhone: "[Your Phone]",
    customerAddress: "[Your Address]",
  });

  return (
    <main className="min-h-screen bg-background">
      <MetaTags
        title="Shopping Cart — KVP JEWELLERY"
        description="Review your selection of handcrafted gold jewellery before checkout."
      />

      {/* Header */}
      <section className="relative py-12 lg:py-16 overflow-hidden bg-[#2D1B10] mb-8">
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
              Shopping Cart
            </h1>
            <p className="text-lg text-white/80 font-light max-w-2xl mx-auto leading-relaxed">
              Review your selection of exquisite gold jewellery.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 lg:py-12 max-w-3xl">

        <div className="space-y-4 mb-8">
          {items.map((item) => (
            <motion.div
              key={item.product.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex gap-4 bg-card rounded-2xl p-4 shadow-soft border border-border"
            >
              <Link to={`/product/${item.product.id}`} className="w-20 h-20 lg:w-24 lg:h-24 rounded-xl overflow-hidden flex-shrink-0">
                <img
                  src={item.product.image || item.product.image_url || '/placeholder.svg'}
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                />
              </Link>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <Link to={`/product/${item.product.id}`} className="font-heading text-sm font-semibold text-foreground hover:text-primary transition-colors">
                    {item.product.name}
                  </Link>
                  <p className="text-primary font-semibold text-sm mt-0.5">₹{(item.product.price * item.quantity).toLocaleString("en-IN")}</p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2 border border-border rounded-full">
                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-1.5 hover:text-primary transition-colors">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className={`p-1.5 transition-colors ${item.quantity >= (item.product.stock_quantity ?? 0) ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:text-primary'}`}
                      disabled={item.quantity >= (item.product.stock_quantity ?? 0)}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button onClick={() => removeFromCart(item.product.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-card rounded-2xl p-6 shadow-soft border border-border">
          <div className="flex justify-between items-center mb-6">
            <span className="font-heading text-lg font-semibold text-foreground">Total</span>
            <span className="text-xl font-bold text-primary">₹{totalAmount.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                if (!user) {
                  toast.error("Please login to proceed to checkout");
                  navigate("/login", { state: { from: location } });
                  return;
                }
                navigate("/checkout");
              }}
              className="flex items-center justify-center gap-2 py-3.5 rounded-full gradient-gold text-primary-foreground font-medium text-sm shadow-gold hover:shadow-elevated transition-all w-full"
            >
              Proceed to Checkout
            </button>
            <button
              onClick={() => {
                if (!user) {
                  toast.error("Please login to order via WhatsApp");
                  navigate("/login", { state: { from: location } });
                  return;
                }
                window.open(quickWhatsAppUrl, '_blank');
              }}
              className="flex items-center justify-center gap-2 py-3.5 rounded-full border border-primary text-primary font-medium text-sm hover:gradient-gold hover:text-primary-foreground hover:border-transparent transition-all w-full"
            >
              <MessageCircle className="w-4 h-4" />
              Order via WhatsApp
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Cart;
