import { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";

const CustomerLayout = ({ children }: { children?: ReactNode }) => {
    return (
        <AuthProvider>
            <WishlistProvider>
                <CartProvider>
                    {children || <Outlet />}
                </CartProvider>
            </WishlistProvider>
        </AuthProvider>
    );
};

export default CustomerLayout;
