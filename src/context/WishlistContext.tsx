import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { Product } from "@/data/products";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

type WishlistItem = Product;

type WishlistContextType = {
    items: WishlistItem[];
    addToWishlist: (product: Product) => Promise<void>;
    removeFromWishlist: (productId: string) => Promise<void>;
    toggleWishlist: (product: Product) => Promise<void>;
    isInWishlist: (productId: string) => boolean;
    clearWishlist: () => void;
    totalItems: number;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [items, setItems] = useState<WishlistItem[]>(() => {
        const saved = localStorage.getItem("wishlist");
        if (!saved) return [];
        try {
            const parsed = JSON.parse(saved) as WishlistItem[];
            // Repair logic for stale data from previous buggy versions
            return parsed.map(item => {
                const hasInStockBoolean = item.inStock !== undefined && item.inStock !== null;
                const hasStockQuantity = item.stock_quantity !== undefined && item.stock_quantity !== null;
                const hasStockStatus = !!(item as any).stock;

                let isProductInStock = item.inStock;
                if (!hasInStockBoolean) {
                    if (hasStockQuantity || hasStockStatus) {
                        const quantityInStock = hasStockQuantity ? (item.stock_quantity ?? 0) > 0 : false;
                        const statusInStock = hasStockStatus ? ((item as any).stock === "In Stock" || (item as any).stock === "Low Stock") : false;
                        isProductInStock = quantityInStock || statusInStock;
                    } else {
                        isProductInStock = true; // Default
                    }
                }
                return { ...item, inStock: isProductInStock };
            });
        } catch (e) {
            return [];
        }
    });

    // Sync with Supabase when user logs in
    useEffect(() => {
        if (user) {
            fetchWishlist();
        }
    }, [user]);

    // Persist to local storage
    useEffect(() => {
        localStorage.setItem("wishlist", JSON.stringify(items));
    }, [items]);

    const fetchWishlist = async () => {
        if (!user?.id) return;
        try {
            const { data, error } = await supabase
                .from('wishlist_items')
                .select('*, product:products(*)')
                .eq('user_id', user.id);

            if (error) throw error;

            if (data) {
                const serverItems: WishlistItem[] = data
                    .filter(item => item.product)
                    .map((item) => {
                        const p = item.product;
                        // Determine stock status: 
                        // 1. Use inStock if it exists
                        // 2. Otherwise check stock_quantity if it exists
                        // 3. Default to true if neither is specified (to avoid false Sold Out)
                        let isProductInStock = true;
                        const hasInStockBoolean = p.inStock !== undefined && p.inStock !== null;
                        const hasStockQuantity = p.stock_quantity !== undefined && p.stock_quantity !== null;
                        const hasStockStatus = !!p.stock;

                        if (hasInStockBoolean) {
                            isProductInStock = p.inStock;
                        } else if (hasStockQuantity || hasStockStatus) {
                            // If we have either, check both. It's in stock if quantity > 0 OR status is "In Stock"
                            const quantityInStock = hasStockQuantity ? p.stock_quantity > 0 : false;
                            const statusInStock = hasStockStatus ? (p.stock === "In Stock" || p.stock === "Low Stock") : false;
                            isProductInStock = quantityInStock || statusInStock;
                        }
                        // Default is true if none of the above matches

                        return {
                            ...p,
                            id: p.id,
                            name: p.name,
                            price: p.price,
                            image: p.image_url || p.image || '/placeholder.svg',
                            image_url: p.image_url,
                            stock_quantity: p.stock_quantity,
                            category: p.category,
                            inStock: isProductInStock,
                            images: p.images || [p.image_url || '/placeholder.svg']
                        };
                    });

                // Merge technique
                const guestItems = [...items];
                const mergedIds = new Set(serverItems.map(i => i.id));
                const mergedItems = [...serverItems];

                for (const guestItem of guestItems) {
                    if (!mergedIds.has(guestItem.id)) {
                        mergedItems.push(guestItem);
                        // Sync new guest item to server
                        await supabase.from('wishlist_items').upsert({
                            user_id: user.id,
                            product_id: guestItem.id
                        });
                    }
                }

                setItems(mergedItems);
            }
        } catch (error: any) {
            // PGRST205 means the table doesn't exist in the schema cache
            if (error?.code === 'PGRST205') {
                console.warn('Wishlist table not found. Please run the SQL migration: create_wishlist_items.sql');
            } else {
                console.error('Error fetching wishlist:', error);
            }
        }
    };

    const isInWishlist = useCallback((productId: string) => {
        return items.some(item => item.id === productId);
    }, [items]);

    const addToWishlist = useCallback(async (product: Product) => {
        if (isInWishlist(product.id)) return;

        // Normalize product before adding to state
        const hasInStockBoolean = product.inStock !== undefined && product.inStock !== null;
        const hasStockQuantity = product.stock_quantity !== undefined && product.stock_quantity !== null;
        const hasStockStatus = !!(product as any).stock;

        let derivedInStock = product.inStock;
        if (!hasInStockBoolean) {
            if (hasStockQuantity || hasStockStatus) {
                const quantityInStock = hasStockQuantity ? (product.stock_quantity ?? 0) > 0 : false;
                const statusInStock = hasStockStatus ? ((product as any).stock === "In Stock" || (product as any).stock === "Low Stock") : false;
                derivedInStock = quantityInStock || statusInStock;
            } else {
                derivedInStock = true;
            }
        }

        const normalizedProduct = {
            ...product,
            inStock: derivedInStock,
            image: product.image_url || product.image || '/placeholder.svg',
            images: product.images || [product.image_url || product.image || '/placeholder.svg']
        };

        setItems(prev => [...prev, normalizedProduct]);

        if (user) {
            try {
                await supabase.from('wishlist_items').insert({
                    user_id: user.id,
                    product_id: product.id
                });
            } catch (error) {
                console.error("Error syncing add to wishlist:", error);
            }
        }
        toast.success(`${product.name} added to wishlist`);
    }, [items, user, isInWishlist]);

    const removeFromWishlist = useCallback(async (productId: string) => {
        const product = items.find(i => i.id === productId);
        setItems(prev => prev.filter(item => item.id !== productId));

        if (user) {
            try {
                await supabase.from('wishlist_items').delete().eq('user_id', user.id).eq('product_id', productId);
            } catch (error) {
                console.error("Error syncing remove from wishlist:", error);
            }
        }
        if (product) {
            toast.info(`${product.name} removed from wishlist`);
        }
    }, [items, user]);

    const toggleWishlist = useCallback(async (product: Product) => {
        if (isInWishlist(product.id)) {
            await removeFromWishlist(product.id);
        } else {
            await addToWishlist(product);
        }
    }, [isInWishlist, addToWishlist, removeFromWishlist]);

    const clearWishlist = useCallback(() => {
        setItems([]);
    }, []);

    const totalItems = items.length;

    const value = useMemo(() => ({
        items, addToWishlist, removeFromWishlist, toggleWishlist, isInWishlist, clearWishlist, totalItems
    }), [items, addToWishlist, removeFromWishlist, toggleWishlist, isInWishlist, clearWishlist, totalItems]);

    return (
        <WishlistContext.Provider value={value}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) throw new Error("useWishlist must be used within a WishlistProvider");
    return context;
};
