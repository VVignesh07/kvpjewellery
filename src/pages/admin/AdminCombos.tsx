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
    Sparkles,
    Filter,
    ArrowUpRight
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    stock: string;
    image_url: string;
    stock_quantity: number;
}

const AdminCombos = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        fetchCombos();

        const channel = supabaseAdmin
            .channel('admin-combos-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'products'
                },
                () => {
                    fetchCombos();
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
    }, [debouncedSearch]);

    const fetchCombos = async () => {
        setLoading(true);
        try {
            let query = supabaseAdmin
                .from('products')
                .select('*')
                .eq('category', 'Combo')
                .order('created_at', { ascending: false });

            if (debouncedSearch) {
                query = query.ilike('name', `%${debouncedSearch}%`);
            }

            const { data, error } = await query;

            if (error) {
                toast.error("Failed to fetch combos");
                console.error(error);
            } else {
                setProducts(data || []);
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
                toast.error("Failed to delete combo");
            } else {
                toast.success("Combo deleted successfully");
                setProducts(prev => prev.filter(p => p.id !== deleteId));
            }
        } finally {
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-4xl font-extrabold tracking-tight text-gray-900">
                        Combo <span className="text-amber-600">Deals</span>
                    </h2>
                    <p className="text-gray-500 text-lg">
                        Manage your curated product sets and bundles.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button asChild className="bg-gradient-to-r from-amber-500 to-amber-700 text-white shadow-lg shadow-amber-500/30 border-none hover:translate-y-[-2px] transition-all">
                        <Link to="/admin/combos/new">
                            <Plus className="mr-2 h-4 w-4" /> Add New Combo
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-3xl shadow-xl shadow-gray-200/50 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-1 w-full translate-z-0">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                        placeholder="Search combos by name..."
                        className="pl-12 h-12 bg-gray-50/50 border-transparent focus:bg-white focus:ring-amber-500 rounded-2xl transition-all font-medium text-gray-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="hidden sm:block text-sm text-gray-400 font-medium px-4">
                    Total: <span className="text-gray-900 font-bold">{products.length}</span> Combos
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/60 overflow-hidden border border-gray-100">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow className="border-b border-gray-100 hover:bg-transparent uppercase tracking-wider">
                            <TableHead className="w-[100px] py-6 pl-8 text-[10px] font-bold text-gray-400">Preview</TableHead>
                            <TableHead className="py-6 text-[10px] font-bold text-gray-400">Combo Details</TableHead>
                            <TableHead className="py-6 text-[10px] font-bold text-gray-400">Price</TableHead>
                            <TableHead className="py-6 text-[10px] font-bold text-gray-400">Stock</TableHead>
                            <TableHead className="text-right py-6 pr-8 text-[10px] font-bold text-gray-400">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <AnimatePresence mode="popLayout">
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20">
                                        <Loader2 className="h-10 w-10 animate-spin text-amber-500 mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : products.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-24 text-gray-400">
                                        No combos found. Create one to get started!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                products.map((product, index) => (
                                    <motion.tr
                                        key={product.id}
                                        layout
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="group border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                                    >
                                        <TableCell className="pl-8 py-5">
                                            <div className="w-16 h-16 bg-gray-100 rounded-2xl overflow-hidden shadow-sm group-hover:scale-110 transition-transform duration-300">
                                                <img
                                                    src={product.image_url || '/placeholder.svg'}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900 group-hover:text-amber-600 transition-colors">{product.name}</span>
                                                <span className="text-xs text-gray-400 font-medium">BUNDLE DEAL</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5 font-bold text-gray-900">
                                            ₹{product.price.toLocaleString("en-IN")}
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
                                                {product.stock_quantity} in stock
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right py-5 pr-8">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    className="h-9 w-9 p-0 rounded-lg hover:bg-amber-50 hover:text-amber-600 transition-colors"
                                                >
                                                    <Link to={`/admin/combos/${product.id}`}>
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

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-[2rem] border-none">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black text-gray-900">Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 font-medium pt-2">
                            This will permanently remove this combo from your inventory. This action cannot be undone.
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
                            Delete Combo
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default AdminCombos;
