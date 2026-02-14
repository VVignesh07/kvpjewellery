import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { Product } from "@/data/products";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export type CartItem = {
  product: Product;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => {
    // Initial load from local storage for everyone
    const savedCart = localStorage.getItem("cartLines");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Sync with Supabase when user changes
  React.useEffect(() => {
    if (user) {
      fetchCart();
    }
  }, [user]);

  // Persist to local storage (for guests or offline backup)
  React.useEffect(() => {
    localStorage.setItem("cartLines", JSON.stringify(items));
  }, [items]);

  const fetchCart = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('*, product:products(*)')
        .eq('user_id', user.id);

      if (error) {
        if (error.message?.includes('AbortError')) return;
        throw error;
      }

      if (data) {
        const serverItems: CartItem[] = data
          .filter(item => item.product)
          .map((item) => ({
            product: {
              ...item.product,
              id: item.product.id,
              name: item.product.name,
              price: item.product.price,
              image: item.product.image_url, // Map DB image_url to frontend image field
              image_url: item.product.image_url,
              stock_quantity: item.product.stock_quantity,
              category: item.product.category,
              stock: item.product.stock || (item.product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock')
            },
            quantity: item.quantity
          }));

        // MERGE STRATEGY: Combine local (guest) cart with server cart
        const guestItems = [...items];
        const mergedItems = [...serverItems];

        let hasNewGuestItems = false;

        for (const guestItem of guestItems) {
          const indexInServer = mergedItems.findIndex(si => si.product.id === guestItem.product.id);

          if (indexInServer > -1) {
            // Priority to server or existing logic
          } else {
            // Item only in guest cart -> Add to merged and flag for sync
            mergedItems.push(guestItem);
            hasNewGuestItems = true;
          }
        }

        if (hasNewGuestItems) {
          const batchInsert = mergedItems.map(item => ({
            user_id: user.id,
            product_id: item.product.id,
            quantity: item.quantity,
            updated_at: new Date().toISOString()
          }));

          await supabase.from('cart_items').upsert(batchInsert, { onConflict: 'user_id, product_id' });
        }

        setItems(mergedItems);
      }
    } catch (error) {
      // Cast error safely if needed or check type
      const err = error as Error;
      if (err?.message?.includes('AbortError')) return;
      console.error('Error fetching/merging cart:', error);
    }
  };

  const addToCart = useCallback(async (product: Product) => {
    const existing = items.find((item) => item.product.id === product.id);
    const currentQty = existing ? existing.quantity : 0;
    const maxStock = product.stock_quantity;

    // Only enforce stock limit if stock_quantity is explicitly provided
    if (maxStock !== undefined && currentQty + 1 > maxStock) {
      toast.error(`Only ${maxStock} items available in stock`);
      return;
    }

    setItems((prev) => {
      let newItems;
      if (existing) {
        newItems = prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        newItems = [...prev, { product, quantity: 1 }];
      }
      return newItems;
    });

    // Supabase Sync - Optimized with upsert
    if (user) {
      try {
        await supabase
          .from('cart_items')
          .upsert({
            user_id: user.id,
            product_id: product.id,
            quantity: currentQty + 1,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id, product_id' });
      } catch (error) {
        console.error("Error syncing add to cart:", error);
      }
    }
  }, [items, user]);

  const removeFromCart = useCallback(async (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));

    if (user) {
      try {
        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
      } catch (error) {
        console.error("Error syncing remove from cart:", error);
      }
    }
  }, [user]);

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    setItems((prev) => {
      const item = prev.find((i) => i.product.id === productId);
      if (!item) return prev;

      const maxStock = item.product.stock_quantity ?? 0;

      if (quantity > maxStock) {
        toast.error(`Only ${maxStock} items available in stock`);
        return prev;
      }

      if (quantity <= 0) {
        return prev.filter((i) => i.product.id !== productId);
      }

      return prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i));
    });

    if (user) {
      try {
        if (quantity <= 0) {
          await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', productId);
        } else {
          await supabase
            .from('cart_items')
            .upsert({
              user_id: user.id,
              product_id: productId,
              quantity: quantity,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id, product_id' });
        }
      } catch (error) {
        console.error("Error syncing update quantity:", error);
      }
    }
  }, [user]);

  const clearCart = useCallback(async () => {
    setItems([]);
    if (user) {
      try {
        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id);
      } catch (error) {
        console.error("Error clearing cart:", error);
      }
    }
  }, [user]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const value = useMemo(() => ({
    items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalAmount
  }), [items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalAmount]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
