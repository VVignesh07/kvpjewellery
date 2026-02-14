import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
    LayoutDashboard,
    Package,
    ShoppingBag,
    Users,
    LogOut,
    Menu,
    X,
    Bell,
    BarChart3,
    Home,
    FolderOpen,
    MessageSquare,
    Settings,
    Check,
    Sparkles,
    Image as ImageIcon
} from "lucide-react";
import { useAdminNotifications } from "@/context/AdminNotificationContext";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAdminAuth } from "@/context/AdminAuthContext";

const AdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false); // Start closed on all, but LG will override via CSS
    const location = useLocation();
    const navigate = useNavigate();
    const { signOut, user, userRole, loading } = useAdminAuth();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useAdminNotifications();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!user || userRole !== 'admin') {
                toast.error("Unauthorized access. Admin privileges required.");
                navigate("/admin/login", { state: { from: location }, replace: true });
            } else {
                setIsAuthorized(true);
            }
        }
    }, [user, userRole, loading, navigate]);

    // Close sidebar on mobile when route changes
    useEffect(() => {
        if (window.innerWidth < 1024) {
            setSidebarOpen(false);
        }
    }, [location.pathname]);

    if (loading || !isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    const handleLogout = async () => {
        await signOut();
        navigate("/admin/login");
    };

    const navItems = [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/products", label: "Products", icon: Package },
        { href: "/admin/categories", label: "Categories", icon: FolderOpen },
        { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
        { href: "/admin/combos", label: "Combos", icon: Sparkles },
        { href: "/admin/customers", label: "Customers", icon: Users },
        { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquare },
        { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
        { href: "/admin/hero-slider", label: "Hero Slider", icon: ImageIcon },
        { href: "/admin/settings", label: "Settings", icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-r border-gray-700/50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-2xl ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                {/* Logo */}
                <div className="h-20 flex items-center justify-center border-b border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
                    <Link to="/admin" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-xl">K</span>
                        </div>
                        <div>
                            <h1 className="font-heading text-xl font-bold text-white tracking-wide">
                                KVP JEWELLERY
                            </h1>
                            <p className="text-xs text-gray-400">Admin Panel</p>
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-2 mt-4">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href || (item.href !== "/admin" && location.pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30"
                                    : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Section */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
                    <Link
                        to="/"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:bg-gray-800/50 hover:text-white transition-all duration-200 mb-2"
                    >
                        <Home className="w-5 h-5" />
                        View Website
                    </Link>
                    <Button
                        variant="outline"
                        className="w-full justify-start gap-3 bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden">
                {/* Header */}
                <header className="h-16 lg:h-20 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shadow-sm">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="w-6 h-6" />
                        </Button>
                        <div>
                            <h2 className="text-lg lg:text-xl font-bold text-gray-900 truncate max-w-[150px] sm:max-w-none">
                                {navItems.find(item =>
                                    location.pathname === item.href ||
                                    (item.href !== "/admin" && location.pathname.startsWith(item.href))
                                )?.label || "Admin Panel"}
                            </h2>
                            <p className="text-[10px] lg:text-sm text-gray-500 whitespace-nowrap">Manage jewelry store</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="relative hover:bg-gray-100">
                                    <Bell className="w-5 h-5 text-gray-600" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] text-white font-bold animate-pulse">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-80 p-0 border-none rounded-2xl shadow-2xl bg-white overflow-hidden">
                                <div className="p-4 bg-gray-50 flex items-center justify-between border-b border-gray-100">
                                    <h3 className="font-bold text-gray-900">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <Button
                                            variant="ghost"
                                            className="h-auto p-0 text-[10px] font-black uppercase text-amber-600 hover:bg-transparent"
                                            onClick={markAllAsRead}
                                        >
                                            Mark all read
                                        </Button>
                                    )}
                                </div>
                                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                    {notifications.length > 0 ? (
                                        notifications.map((n) => (
                                            <DropdownMenuItem
                                                key={n.id}
                                                className={`p-4 flex flex-col items-start gap-1 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 cursor-default focus:bg-gray-50/50 ${!n.is_read ? 'bg-amber-50/30' : ''}`}
                                            >
                                                <div className="flex justify-between w-full">
                                                    <span className="text-xs font-bold text-gray-900">{n.title}</span>
                                                    {!n.is_read && (
                                                        <Button
                                                            variant="ghost"
                                                            className="h-auto p-0 text-[10px] uppercase text-gray-400 hover:text-amber-600 transition-colors"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                markAsRead(n.id);
                                                            }}
                                                        >
                                                            <Check className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-gray-500 leading-tight">{n.message}</p>
                                                <span className="text-[9px] text-gray-400 mt-1 uppercase font-medium">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </DropdownMenuItem>
                                        ))
                                    ) : (
                                        <div className="p-10 text-center flex flex-col items-center gap-3">
                                            <Bell className="h-8 w-8 text-gray-200" />
                                            <p className="text-sm text-gray-400 font-medium">No alerts today</p>
                                        </div>
                                    )}
                                </div>
                                <DropdownMenuSeparator className="m-0" />
                                <DropdownMenuItem asChild className="p-3 text-center justify-center font-bold text-xs text-gray-500 hover:text-amber-600 focus:bg-transparent">
                                    <Link to="/admin/orders">View All Orders</Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-9 w-9 lg:h-10 lg:w-10 rounded-full hover:bg-gray-100">
                                    <Avatar className="h-9 w-9 lg:h-10 lg:w-10 border-2 border-amber-500">
                                        <AvatarFallback className="bg-gradient-to-br from-amber-400 to-amber-600 text-white font-semibold text-xs lg:text-sm">
                                            {user?.email?.charAt(0).toUpperCase() || 'A'}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-semibold leading-none">Admin User</p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {user?.email || 'admin@kvp.com'}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
