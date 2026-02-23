import { useState } from "react";

import { motion } from "framer-motion";
import { MessageCircle, ArrowLeft, Loader2, CheckCircle2, CreditCard } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { generateWhatsAppOrderUrl } from "@/lib/whatsapp";
import { generateOrderUPILink } from "@/lib/upi";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const allowedPincodes = [
  "628501", "628502", "628503", "628714", "628720",
  "628712", "628902", "628904", "628721", "628901", "628613"
];

const Checkout = () => {
  const { items, totalAmount, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "", address: "", pincode: "" });
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "cod">("upi");
  const [loading, setLoading] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [currentOrderData, setCurrentOrderData] = useState<any>(null);
  const [paymentLink, setPaymentLink] = useState("");
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const shippingFee = totalAmount > 500 ? 0 : 50;
  const grandTotal = totalAmount + shippingFee;

  const isCodAvailable = allowedPincodes.includes(form.pincode);

  // Effect to automatically switch to UPI if COD becomes unavailable
  if (paymentMethod === "cod" && !isCodAvailable && form.pincode.length >= 6) {
    setPaymentMethod("upi");
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Nothing to checkout</h1>
          <Link to="/shop" className="text-primary text-sm underline">Go to Shop</Link>
        </div>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.address || !form.pincode) {
      toast.error("Please fill all fields");
      return;
    }

    if (paymentMethod === "cod" && !isCodAvailable) {
      toast.error("Cash on Delivery is not available for this pincode.");
      return;
    }

    setLoading(true);

    try {
      // 1. Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please login to place an order");
        navigate("/login");
        return;
      }

      // 2. Generate Order Number using secure RPC function
      const { data: orderNumber, error: numError } = await supabase.rpc('get_next_order_number');

      if (numError) throw numError;
      if (!orderNumber) throw new Error("Failed to generate order number");

      // 2. Create Order in Supabase with appropriate status
      const orderStatus = paymentMethod === "upi" ? "pending_payment" : "pending";

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          status: orderStatus,
          total_amount: grandTotal,
          shipping_fee: shippingFee,
          shipping_address: form,
          payment_method: paymentMethod
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 3. Insert Order Items
      const orderItems = items.map(item => ({
        order_id: orderData.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_image: item.product.image || item.product.image_url,
        quantity: item.quantity,
        price: item.product.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 4. Handle payment method
      if (paymentMethod === "upi") {
        // UPI Flow: Open UPI app, then show confirmation dialog
        const upiLink = generateOrderUPILink(orderNumber, grandTotal);
        setPaymentLink(upiLink);

        // Store order data for later use
        setCurrentOrderData({
          orderNumber,
          orderId: orderData.id,
        });

        // Open UPI payment app ONLY on mobile to avoid deep link errors on desktop
        if (isMobile) {
          console.log("📱 Mobile device detected, attempting to launch UPI app...");
          window.location.href = upiLink;
        } else {
          console.log("💻 Desktop device detected, skipping automatic UPI redirect.");
        }

        // Show payment confirmation dialog after a short delay
        setTimeout(() => {
          setShowPaymentDialog(true);
          setLoading(false);
        }, isMobile ? 1000 : 100); // Faster on desktop since there's no redirect attempt

      } else {
        // COD Flow: Direct to WhatsApp
        const url = generateWhatsAppOrderUrl({
          products: items.map((item) => ({
            name: item.product.name,
            price: item.product.price * item.quantity,
            quantity: item.quantity,
          })),
          total: grandTotal,
          shippingFee: shippingFee,
          customerName: form.name,
          customerPhone: form.phone,
          customerAddress: `${form.address}, ${form.pincode}`,
          orderId: orderNumber
        });

        window.open(url, "_blank");
        clearCart();
        toast.success("Order placed successfully!");
        navigate("/profile");
        setLoading(false);
      }

    } catch (error: any) {
      console.error("Checkout Error:", error);
      toast.error("Failed to place order: " + (error.message || "Unknown error"));
      setLoading(false);
    }
  };

  const handlePaymentConfirmed = async () => {
    setLoading(true);
    try {
      // Update order status to pending
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'pending' })
        .eq('id', currentOrderData.orderId);

      if (updateError) throw updateError;

      // Open WhatsApp
      const url = generateWhatsAppOrderUrl({
        products: items.map((item) => ({
          name: item.product.name,
          price: item.product.price * item.quantity,
          quantity: item.quantity,
        })),
        total: grandTotal,
        shippingFee: shippingFee,
        customerName: form.name,
        customerPhone: form.phone,
        customerAddress: `${form.address}, ${form.pincode}`,
        orderId: currentOrderData.orderNumber
      });

      window.open(url, "_blank");
      clearCart();
      setShowPaymentDialog(false);
      toast.success("Order placed successfully!");
      navigate("/profile");
    } catch (error: any) {
      console.error("Payment confirmation error:", error);
      toast.error("Failed to confirm payment: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentCancelled = async () => {
    setLoading(true);
    try {
      // Update order status to cancelled
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', currentOrderData.orderId);

      if (updateError) throw updateError;

      setShowPaymentDialog(false);
      toast.error("Payment cancelled. Please try again.");
    } catch (error: any) {
      console.error("Payment cancellation error:", error);
      toast.error("Failed to cancel order: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 lg:py-12 max-w-lg">
        <Link to="/cart" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Cart
        </Link>

        <h1 className="font-heading text-2xl lg:text-3xl font-bold text-foreground mb-8">Checkout</h1>

        {/* Order summary */}
        <div className="bg-card rounded-2xl p-5 shadow-soft border border-border mb-6">
          <h2 className="font-heading text-sm font-semibold text-foreground mb-3">Order Summary</h2>
          {items.map((item) => (
            <div key={item.product.id} className="flex justify-between text-sm py-1.5 border-b border-border last:border-0">
              <span className="text-muted-foreground">{item.product.name} × {item.quantity}</span>
              <span className="text-foreground font-medium">₹{(item.product.price * item.quantity).toLocaleString("en-IN")}</span>
            </div>
          ))}
          <div className="flex justify-between py-1.5 border-b border-border last:border-0 text-sm">
            <span className="text-muted-foreground">Shipping Fee</span>
            <span className="text-foreground font-medium">
              {shippingFee === 0 ? (
                <span className="text-green-600 font-bold">FREE</span>
              ) : (
                `₹${shippingFee}`
              )}
            </span>
          </div>
          <div className="flex justify-between mt-3 pt-3 border-t border-border">
            <span className="font-heading font-semibold text-foreground">Total</span>
            <span className="font-bold text-primary text-lg">₹{grandTotal.toLocaleString("en-IN")}</span>
          </div>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              placeholder="Enter your name"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Mobile Number</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              placeholder="+91 88255 64893"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Pincode</label>
            <input
              type="text"
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              placeholder="Enter pincode to check COD availability"
              maxLength={6}
              required
            />
            {form.pincode.length >= 6 && (
              <p className={`text-xs mt-1 ${isCodAvailable ? 'text-green-600' : 'text-red-500'}`}>
                {isCodAvailable ? "Cash on Delivery available for this location" : "Cash on Delivery is NOT available for this location"}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Delivery Address</label>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
              placeholder="Full address (House No, Street, Area)"
              required
            />
          </div>

          {/* Payment method */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Payment Method</label>
            <div className={`flex gap-3 ${!isCodAvailable ? 'flex-col' : ''}`}>
              <button
                type="button"
                onClick={() => setPaymentMethod("upi")}
                className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${paymentMethod === "upi"
                  ? "gradient-gold text-primary-foreground border-transparent shadow-gold"
                  : "border-border text-muted-foreground hover:border-primary"
                  }`}
              >
                UPI (GPay / PhonePe)
              </button>
              {isCodAvailable && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cod")}
                  className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${paymentMethod === "cod"
                    ? "gradient-gold text-primary-foreground border-transparent shadow-gold"
                    : "border-border text-muted-foreground hover:border-primary"
                    }`}
                >
                  Cash on Delivery
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full gradient-gold text-primary-foreground font-medium text-sm shadow-gold hover:shadow-elevated transition-all mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (paymentMethod === "upi" ? <CreditCard className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />)}
            {loading ? "Processing..." : (paymentMethod === "upi" ? `Pay ₹${grandTotal.toLocaleString("en-IN")} via UPI` : "Complete Order via WhatsApp")}
          </button>
        </motion.form>

        {/* Payment Confirmation Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
              </div>
              <DialogTitle className="text-center text-xl">Payment Confirmation</DialogTitle>
              <DialogDescription className="text-center">
                {isMobile
                  ? "Open your UPI app to pay or scan the QR code below."
                  : "Please scan the QR code below using any UPI app to complete your payment."
                }
                <br />
                Amount: <span className="font-bold text-primary">₹{grandTotal.toLocaleString("en-IN")}</span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-col gap-2 mt-4">
              {paymentMethod === "upi" && (
                <div className="flex flex-col items-center justify-center mb-4">
                  <div className="w-full max-w-[280px] bg-black rounded-3xl p-6 shadow-2xl border border-zinc-800 flex flex-col items-center gap-4 relative overflow-hidden">
                    {/* PhonePe Branding */}
                    <div className="flex flex-col items-center gap-1 z-10">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#5f259f] flex items-center justify-center">
                          <span className="text-white font-bold text-lg">पे</span>
                        </div>
                        <span className="text-white font-bold text-xl tracking-tight">PhonePe</span>
                      </div>
                      <span className="text-[#9b6bcc] text-[10px] font-bold tracking-[0.2em] uppercase">Accepted Here</span>
                    </div>

                    {/* QR Code Placeholder/Image */}
                    <div className="w-full aspect-square bg-white rounded-2xl p-4 flex items-center justify-center overflow-hidden z-10">
                      <img
                        src="/assets/images/payment_qr.png"
                        alt="PhonePe QR Code"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentLink)}`;
                        }}
                      />
                    </div>

                    {/* Payee Details */}
                    <div className="flex flex-col items-center gap-0.5 z-10">
                      <span className="text-white/60 text-[10px] uppercase tracking-widest">Payable To</span>
                      <span className="text-white font-bold text-sm tracking-wide">BALASUNDARI M</span>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#5f259f]/10 blur-[60px] rounded-full -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#5f259f]/10 blur-[60px] rounded-full -ml-16 -mb-16"></div>
                  </div>

                  <div className="mt-6 w-full space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-amber-700 text-xs font-bold">1</span>
                      </div>
                      <p className="text-xs text-amber-900 leading-relaxed">
                        {isMobile ? "Open UPI app or scan QR" : "Scan the QR code"} and pay <span className="font-bold">₹{grandTotal.toLocaleString("en-IN")}</span>.
                      </p>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-amber-700 text-xs font-bold">2</span>
                      </div>
                      <p className="text-xs text-amber-900 leading-relaxed">
                        After payment, <span className="font-bold">take a screenshot</span> of the success screen.
                      </p>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-amber-700 text-xs font-bold">3</span>
                      </div>
                      <p className="text-xs text-amber-900 leading-relaxed">
                        Click "Payment Completed" below to <span className="font-bold">send proof on WhatsApp</span>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === "upi" && paymentLink && isMobile && (
                <a
                  href={paymentLink}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-all mb-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Open Payment App
                </a>
              )}
              <button
                onClick={handlePaymentConfirmed}
                disabled={loading}
                className="w-full py-3.5 rounded-full gradient-gold text-primary-foreground font-bold text-sm shadow-gold hover:shadow-elevated transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4" />
                    Confirm & Send Proof on WhatsApp
                  </>
                )}
              </button>
              <button
                onClick={handlePaymentCancelled}
                disabled={loading}
                className="w-full py-3 rounded-full border border-border text-muted-foreground font-medium text-sm hover:bg-accent transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                No, Cancel Order
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
};

export default Checkout;
