import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Menu, X, User, LogOut, Heart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { CartDrawer } from "@/components/cart/CartDrawer";

const Navbar = () => {
  const { totalItems, setDrawerOpen } = useCart();
  const { totalItems: wishlistCount } = useWishlist();
  const { user, profile, signOut, displayIdentifier } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/shop", label: "Shop" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
    { to: "/combo", label: "Combo" },
  ];

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border shadow-sm">
      <nav className="container mx-auto flex items-center justify-between px-4 py-3 lg:py-4">
        <Link to="/" className="font-heading flex items-center gap-2 group">
          <div className="flex flex-col -space-y-1">
            <span className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tighter text-primary">KVP</span>
            <div className="h-0.5 w-full bg-primary/20 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-0 group-hover:w-full transition-all duration-500" />
            </div>
          </div>
          <span className="text-base sm:text-lg lg:text-xl font-bold tracking-[0.15em] text-foreground uppercase pt-1">
            JEWELLERY
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-10">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="text-sm font-medium tracking-wide text-muted-foreground hover:text-primary transition-all duration-300 relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Profile Icon with Dropdown */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2.5 hover:text-primary transition-colors focus:outline-none" title="Profile">
                  <User className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 mt-2">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1 py-1">
                    <p className="text-sm font-semibold">My Account</p>
                    <p className="text-xs text-muted-foreground truncate">{displayIdentifier}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer py-3" asChild>
                  <Link to="/profile" className="flex w-full items-center">
                    <User className="mr-3 h-4 w-4" />
                    <span className="text-sm font-medium">My Orders</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer py-3 text-destructive focus:text-destructive">
                  <LogOut className="mr-3 h-4 w-4" />
                  <span className="text-sm font-medium">Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login" className="p-2.5 hover:text-primary transition-colors" title="Login">
              <User className="w-5 h-5 sm:w-6 sm:h-6" />
            </Link>
          )}

          <Link to="/wishlist" className="relative p-2.5 hover:text-primary transition-colors" title="Wishlist">
            <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
            {wishlistCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold shadow-sm">
                {wishlistCount}
              </span>
            )}
          </Link>

          <button
            onClick={() => setDrawerOpen(true)}
            className="relative p-2.5 hover:text-primary transition-colors focus:outline-none"
            title="Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
            {totalItems > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold shadow-sm">
                {totalItems}
              </span>
            )}
          </button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="lg:hidden p-2.5 text-foreground hover:bg-muted rounded-full transition-colors relative z-[60]"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </motion.button>
        </div>
      </nav>

      {/* Mobile menu container */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{ willChange: "transform, height, opacity" }}
            className="lg:hidden overflow-hidden border-b border-border bg-background shadow-lg"
          >
            <div className="container mx-auto px-4 py-6 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="text-base sm:text-lg font-semibold py-3.5 px-4 rounded-xl text-foreground hover:bg-primary/5 hover:text-primary transition-all flex items-center justify-between group active:bg-primary/10"
                >
                  <span className="tracking-tight">{link.label}</span>
                  <span className="text-primary/30 group-hover:translate-x-1 transition-transform text-xl">→</span>
                </Link>
              ))}

              {user && (
                <div className="mt-2 space-y-1">
                  <div className="border-t border-border/60 my-4 mx-4" />
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="text-base font-medium py-3.5 px-4 rounded-xl text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all flex items-center gap-4"
                  >
                    <User className="h-5 w-5" />
                    My Account
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileOpen(false);
                    }}
                    className="w-full text-base font-medium py-3.5 px-4 rounded-xl text-destructive hover:bg-destructive/5 transition-all text-left flex items-center gap-4"
                  >
                    <LogOut className="h-5 w-5" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <CartDrawer />
    </header>
  );
};

export default Navbar;
