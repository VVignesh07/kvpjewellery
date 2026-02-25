import { useNavigate } from "react-router-dom";
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetClose,
} from "@/components/ui/sheet";
import { CloudinaryImage } from "@/components/ui/CloudinaryImage";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export function CartDrawer() {
    const { items, totalAmount, updateQuantity, removeFromCart, isDrawerOpen, setDrawerOpen } = useCart();
    const navigate = useNavigate();

    const handleCheckout = () => {
        setDrawerOpen(false);
        navigate("/checkout");
    };

    const handleViewCart = () => {
        setDrawerOpen(false);
        navigate("/cart");
    };

    return (
        <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
            <SheetContent className="w-full sm:max-w-md p-0 flex flex-col border-l border-border shadow-2xl">
                <SheetHeader className="p-6 border-b border-border bg-card">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="font-heading text-xl font-bold flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-primary" />
                            Your Cart
                            <span className="ml-2 bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">
                                {items.reduce((acc, item) => acc + item.quantity, 0)} Items
                            </span>
                        </SheetTitle>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-hidden">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center p-10 text-center space-y-4">
                            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-2">
                                <ShoppingBag className="w-10 h-10 text-muted-foreground/40" />
                            </div>
                            <h3 className="font-heading text-lg font-semibold">Your cart is empty</h3>
                            <p className="text-sm text-muted-foreground">Discover our beautiful jewellery collection and add something special to your cart.</p>
                            <Button onClick={() => setDrawerOpen(false)} variant="outline" className="rounded-full px-8 mt-4">
                                Start Shopping
                            </Button>
                        </div>
                    ) : (
                        <ScrollArea className="h-full px-6 py-2">
                            <div className="space-y-6 py-4">
                                {items.map((item) => (
                                    <div key={item.product.id} className="flex gap-4 group">
                                        <div className="w-20 h-20 bg-muted rounded-xl overflow-hidden flex-shrink-0 border border-border group-hover:border-primary/30 transition-colors shadow-sm">
                                            <CloudinaryImage
                                                src={item.product.image || item.product.image_url || '/placeholder.svg'}
                                                alt={item.product.name}
                                                width={100}
                                                height={100}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between py-0.5">
                                            <div className="space-y-1">
                                                <h4 className="font-heading text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors cursor-pointer" onClick={() => { setDrawerOpen(false); navigate(`/product/${item.product.id}`); }}>
                                                    {item.product.name}
                                                </h4>
                                                <p className="text-primary font-bold text-sm">₹{(item.product.price * item.quantity).toLocaleString("en-IN")}</p>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center bg-muted/50 border border-border/50 rounded-full p-0.5">
                                                    <button
                                                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                        className="p-1 hover:text-primary transition-colors rounded-full hover:bg-white shadow-sm"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="text-[11px] font-bold w-6 text-center">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                        disabled={item.quantity >= (item.product.stock_quantity ?? 0)}
                                                        className="p-1 hover:text-primary transition-colors rounded-full hover:bg-white shadow-sm disabled:opacity-30"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(item.product.id)}
                                                    className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                                                    title="Remove item"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                {items.length > 0 && (
                    <div className="p-6 bg-card border-t border-border space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground font-medium uppercase tracking-[0.1em]">Subtotal</span>
                                <span className="text-lg font-bold">₹{totalAmount.toLocaleString("en-IN")}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground/80 italic">Tax and shipping will be calculated at checkout.</p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 pt-2">
                            <Button onClick={handleCheckout} className="w-full rounded-full h-12 gradient-gold text-primary-foreground font-bold shadow-gold group transition-all duration-300">
                                Proceed to Checkout
                                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                            <Button onClick={handleViewCart} variant="outline" className="w-full rounded-full h-12 font-semibold border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all">
                                View Full Bag
                            </Button>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
