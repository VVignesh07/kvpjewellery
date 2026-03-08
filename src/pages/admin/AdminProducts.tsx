import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Plus,
    Search,
    Trash,
    Edit,
    Loader2,
    Package,
    ArrowUpRight,
    Filter
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { CloudinaryImage } from "@/components/ui/CloudinaryImage";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    stock: string;
    image_url: string;
    stock_quantity: number;
}

const PRODUCTS_PER_PAGE = 50;

const AdminProducts = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    // Debounce search term and reset page
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(0); // Reset to first page on search
        }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        fetchProducts();

        // REALTIME: Listen for product changes
        const channel = supabaseAdmin
            .channel('admin-products-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'products'
                },
                (payload) => {
                    console.log('📦 Realtime product update:', payload);
                    fetchProducts();
                }
            )
            .subscribe();

        return () => {
            if (channel) {
                const cleanup = async () => {
                    try {
                        if (channel.state !== 'closed' && channel.state !== 'errored') {
                            await supabaseAdmin.removeChannel(channel).catch(() => { });
                        }
                    } catch (e) {
                        // Silent fail
                    }
                };
                cleanup();
            }
        };
    }, [debouncedSearch, currentPage]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const from = currentPage * PRODUCTS_PER_PAGE;
            const to = from + PRODUCTS_PER_PAGE - 1;

            let query = supabaseAdmin
                .from('products')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(from, to);

            if (debouncedSearch) {
                query = query.or(`name.ilike.%${debouncedSearch}%,category.ilike.%${debouncedSearch}%`);
            }

            const { data, error, count } = await query;

            if (error) {
                toast.error("Failed to fetch products");
                console.error(error);
            } else {
                setProducts(data || []);
                setTotalCount(count || 0);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            const { error } = await supabaseAdmin
                .from('products')
                .delete()
                .eq('id', deleteId);

            if (error) {
                toast.error("Failed to delete product");
                console.error(error);
            } else {
                toast.success("Product deleted successfully");
                setProducts(prev => prev.filter(p => p.id !== deleteId));
            }
        } finally {
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
        }
    };

    const getStockBadge = (stock: string) => {
        switch (stock) {
            case "In Stock":
                return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "Low Stock":
                return "bg-amber-100 text-amber-700 border-amber-200";
            default:
                return "bg-rose-100 text-rose-700 border-rose-200";
        }
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-2xl lg:text-4xl font-extrabold tracking-tight text-gray-900">
                        Product <span className="text-amber-600">Inventory</span>
                    </h2>
                    <p className="text-gray-500 text-sm lg:text-lg">
                        Manage your jewelry collection.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="hidden sm:flex border-gray-200 shadow-sm">
                        <Filter className="mr-2 h-4 w-4" /> Filter
                    </Button>
                    <Button asChild className="bg-gradient-to-r from-amber-500 to-amber-700 text-white shadow-lg shadow-amber-500/30 border-none hover:translate-y-[-2px] transition-all">
                        <Link to="/admin/products/new">
                            <Plus className="mr-2 h-4 w-4" /> Add New Product
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="bg-white p-4 rounded-3xl shadow-xl shadow-gray-200/50 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-1 w-full translate-z-0">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                        placeholder="Search by name or category..."
                        className="pl-12 h-12 bg-gray-50/50 border-transparent focus:bg-white focus:ring-amber-500 rounded-2xl transition-all font-medium text-gray-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="hidden sm:block text-sm text-gray-400 font-medium px-4">
                    Total: <span className="text-gray-900 font-bold">{totalCount}</span> Products
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/60 overflow-hidden border border-gray-100">
                <div className="overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[800px]">
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="border-b border-gray-100 hover:bg-transparent uppercase tracking-wider">
                                <TableHead className="w-[100px] py-6 pl-8 text-[10px] font-bold text-gray-400">Preview</TableHead>
                                <TableHead className="py-6 text-[10px] font-bold text-gray-400">Product Details</TableHead>
                                <TableHead className="py-6 text-[10px] font-bold text-gray-400">Category</TableHead>
                                <TableHead className="py-6 text-[10px] font-bold text-gray-400">Price</TableHead>
                                <TableHead className="py-6 text-[10px] font-bold text-gray-400">Availability</TableHead>
                                <TableHead className="text-right py-6 pr-8 text-[10px] font-bold text-gray-400">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence mode="popLayout">
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-20">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
                                                <p className="text-sm text-gray-400 font-medium">Fetching pieces from inventory...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : products.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-24">
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="flex flex-col items-center gap-4"
                                            >
                                                <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center">
                                                    <Package className="h-10 w-10 text-amber-300" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xl font-bold text-gray-900">Your inventory is empty</p>
                                                    <p className="text-sm text-gray-500">Start by adding your first masterpiece to your collection.</p>
                                                </div>
                                                <Button asChild className="mt-2 rounded-xl">
                                                    <Link to="/admin/products/new">Add Product</Link>
                                                </Button>
                                            </motion.div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    products.map((product, index) => (
                                        <motion.tr
                                            key={product.id}
                                            layout
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10, scale: 0.95 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="group border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                                        >
                                            <TableCell className="pl-8 py-5">
                                                <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm group-hover:scale-110 transition-transform duration-300 ring-4 ring-transparent group-hover:ring-amber-100/50">
                                                    <CloudinaryImage
                                                        src={product.image_url}
                                                        alt={product.name}
                                                        width={64}
                                                        height={64}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900 group-hover:text-amber-600 transition-colors">{product.name}</span>
                                                    <span className="text-xs text-gray-400 font-medium mt-0.5 mt-0.5 flex items-center gap-1">
                                                        ID: {product.id.substring(0, 8).toUpperCase()} <ArrowUpRight className="h-2 w-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5">
                                                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-lg uppercase tracking-wider">
                                                    {product.category}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-5 font-bold text-gray-900">
                                                ₹{product.price.toLocaleString("en-IN")}
                                            </TableCell>
                                            <TableCell className="py-5">
                                                <div className="flex flex-col gap-1.5">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${getStockBadge(product.stock)}`}>
                                                        {product.stock}
                                                    </span>
                                                    <p className="text-[10px] text-gray-400 font-bold ml-1">{product.stock_quantity} available</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right py-5 pr-8">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        asChild
                                                        variant="ghost"
                                                        className="h-9 w-9 p-0 rounded-lg hover:bg-amber-50 hover:text-amber-600 transition-colors"
                                                    >
                                                        <Link to={`/admin/products/${product.id}`}>
                                                            <Edit className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setDeleteId(product.id);
                                                            setIsDeleteDialogOpen(true);
                                                        }}
                                                        className="h-9 w-9 p-0 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors text-gray-400"
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Legend / Info */}
            <div className="flex items-center justify-center gap-6 pt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" /> High Availability
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" /> Low Stock Warning
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500" /> Critical / Out
                </div>
            </div>

            {/* Pagination Controls */}
            {totalCount > PRODUCTS_PER_PAGE && (
                <div className="mt-8 flex justify-center">
                    <Pagination>
                        <PaginationContent className="bg-white rounded-2xl shadow-lg border border-gray-100 p-1">
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (currentPage > 0) setCurrentPage(prev => prev - 1);
                                    }}
                                    className={`${currentPage === 0 ? "pointer-events-none opacity-50" : "hover:bg-amber-50 hover:text-amber-600 transition-colors"} rounded-xl`}
                                />
                            </PaginationItem>

                            <PaginationItem className="px-4">
                                <span className="text-sm font-bold text-gray-900">
                                    Page {currentPage + 1} of {Math.ceil(totalCount / PRODUCTS_PER_PAGE)}
                                </span>
                            </PaginationItem>

                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        const maxPage = Math.ceil(totalCount / PRODUCTS_PER_PAGE) - 1;
                                        if (currentPage < maxPage) setCurrentPage(prev => prev + 1);
                                    }}
                                    className={`${currentPage >= Math.ceil(totalCount / PRODUCTS_PER_PAGE) - 1 ? "pointer-events-none opacity-50" : "hover:bg-amber-50 hover:text-amber-600 transition-colors"} rounded-xl`}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-[2rem] border-none">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black text-gray-900">Remove Piece?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 font-medium pt-2">
                            This masterpiece will be permanently removed from your inventory. This action cannot be reversed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 pt-6">
                        <AlertDialogCancel className="rounded-2xl border-gray-100 font-bold hover:bg-gray-50 transition-all">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="rounded-2xl bg-rose-600 hover:bg-rose-700 font-bold transition-all shadow-lg shadow-rose-200"
                        >
                            Confirm Deletion
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default AdminProducts;
