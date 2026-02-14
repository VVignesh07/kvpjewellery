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

const Navbar = () => {
  const { totalItems } = useCart();
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

          <Link to="/cart" className="relative p-2.5 hover:text-primary transition-colors">
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
            {totalItems > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold shadow-sm">
                {totalItems}
              </span>
            )}
          </Link>
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

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden overflow-hidden border-b border-border bg-background/95 backdrop-blur-md"
          >
            <div className="container mx-auto px-4 py-8 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="text-lg font-semibold py-4 px-5 rounded-2xl text-foreground hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-between group active:scale-[0.98]"
                >
                  {link.label}
                  <span className="text-primary/30 group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              ))}
              {user && (
                <>
                  <div className="border-t border-border my-6 mx-5" />
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileOpen(false);
                    }}
                    className="text-lg font-semibold py-4 px-5 rounded-2xl text-destructive hover:bg-destructive/10 transition-all text-left flex items-center gap-4 active:scale-[0.98]"
                  >
                    <LogOut className="h-5 w-5" />
                    Logout
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
