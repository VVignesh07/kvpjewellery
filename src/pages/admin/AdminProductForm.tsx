import { useState, useEffect } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save, X, Sparkles, Image as ImageIcon, Briefcase } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { CloudinaryUpload } from "@/components/admin/CloudinaryUpload";
import { ImageReorder } from "@/components/admin/ImageReorder";
import { motion } from "framer-motion";

const AdminProductForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const isEditMode = !!id;
    const isComboMode = location.pathname.includes("/admin/combos");

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEditMode);
    const [images, setImages] = useState<string[]>([]);
    const [activeCategories, setActiveCategories] = useState<{ id: string; name: string }[]>([]);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        original_price: "",
        category: isComboMode ? "Combo" : "",
        stock_quantity: ""
    });

    useEffect(() => {
        if (isEditMode && id) {
            fetchProduct(id);
        }
    }, [id, isEditMode]);

    useEffect(() => {
        const fetchActiveCategories = async () => {
            const { data, error } = await supabaseAdmin
                .from('categories')
                .select('id, name')
                .eq('is_active', true)
                .order('name', { ascending: true });
            if (!error && data) {
                setActiveCategories(data);
            }
        };
        if (!isComboMode) {
            fetchActiveCategories();
        }
    }, [isComboMode]);

    const fetchProduct = async (productId: string) => {
        setFetching(true);
        const { data, error } = await supabaseAdmin
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (error) {
            toast.error("Failed to fetch product");
            console.error(error);
            navigate("/admin/products");
        } else if (data) {
            setFormData({
                name: data.name,
                description: data.description || "",
                price: data.price.toString(),
                original_price: data.original_price ? data.original_price.toString() : "",
                category: data.category,
                stock_quantity: data.stock_quantity !== null && data.stock_quantity !== undefined ? data.stock_quantity.toString() : "",
            });
            if (data.images && data.images.length > 0) {
                setImages(data.images);
            } else if (data.image_url) {
                setImages([data.image_url]);
            }
        }
        setFetching(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (url: string) => {
        setImages(prev => [...prev, url]);
    };

    const handleRemoveImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const getStockStatus = (quantity: number) => {
        if (quantity <= 0) return "Out of Stock";
        if (quantity < 5) return "Low Stock";
        return "In Stock";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.price || !formData.category) {
            toast.error("Please fill in all required fields");
            return;
        }

        if (images.length === 0) {
            toast.error("Please upload at least one image");
            return;
        }

        setLoading(true);
        try {
            const quantity = formData.stock_quantity === "" ? 0 : parseInt(formData.stock_quantity);
            const stockStatus = getStockStatus(quantity);

            const productData = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                original_price: formData.original_price ? parseFloat(formData.original_price) : null,
                category: formData.category,
                stock_quantity: quantity,
                stock: stockStatus,
                images: images,
                image_url: images[0]
            };

            if (isEditMode) {
                const { error } = await supabaseAdmin
                    .from('products')
                    .update(productData)
                    .eq('id', id);

                if (error) throw error;
                toast.success("Piece updated flawlessly");
            } else {
                const { error } = await supabaseAdmin
                    .from('products')
                    .insert([productData]);

                if (error) throw error;
                toast.success("New masterpiece added to collection");
            }
            navigate(isComboMode ? "/admin/combos" : "/admin/products");
        } catch (error) {
            console.error("Error saving product:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to save product";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-20">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-8"
            >
                <Button
                    variant="ghost"
                    className="pl-0 text-gray-400 hover:text-amber-600 hover:bg-transparent transition-all group font-bold"
                    onClick={() => navigate(isComboMode ? "/admin/combos" : "/admin/products")}
                >
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Back to {isComboMode ? "Combos" : "Inventory"}
                </Button>
                <div className="mt-4 space-y-1">
                    <h2 className="text-4xl font-extrabold tracking-tight text-gray-900">
                        {isEditMode ? "Edit" : "Create"} <span className="text-amber-600">{isComboMode ? "Combo" : "Product"}</span>
                    </h2>
                    <p className="text-gray-500 text-lg">
                        {isComboMode
                            ? (isEditMode ? "Refine your exclusive bundle deal." : "Create a new value bundle for your customers.")
                            : (isEditMode ? "Refine the details of your jewelry piece." : "Add a new masterpiece to your curated collection.")
                        }
                    </p>
                </div>
            </motion.div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-none shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden overflow-visible">
                        <CardHeader className="border-b border-gray-50 bg-gray-50/30">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Briefcase className="h-5 w-5 text-amber-500" />
                                General Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-8 space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-gray-400">Product Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="Ex: 22K Gold Handcrafted Necklace"
                                    className="h-12 rounded-xl bg-gray-50 focus:bg-white transition-all border-none focus:ring-2 focus:ring-amber-500/20 font-medium"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-xs font-bold uppercase tracking-widest text-gray-400">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    placeholder="Tell the story behind this piece..."
                                    className="rounded-xl bg-gray-50 focus:bg-white transition-all border-none focus:ring-2 focus:ring-amber-500/20 font-medium min-h-[150px]"
                                    value={formData.description}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category" className="text-xs font-bold uppercase tracking-widest text-gray-400">Category</Label>
                                    <Select
                                        name="category"
                                        value={formData.category}
                                        onValueChange={(value) => handleSelectChange("category", value)}
                                        disabled={isComboMode}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-amber-500/20 font-medium capitalize">
                                            <SelectValue placeholder="Luxury Category" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                                            {isComboMode ? (
                                                <SelectItem value="Combo" className="rounded-xl p-3 font-medium cursor-pointer">
                                                    Combo
                                                </SelectItem>
                                            ) : (
                                                activeCategories.map(cat => (
                                                    <SelectItem key={cat.id} value={cat.name} className="rounded-xl p-3 font-medium cursor-pointer">
                                                        {cat.name}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="stock_quantity" className="text-xs font-bold uppercase tracking-widest text-gray-400">Quantity in Stock</Label>
                                    <Input
                                        id="stock_quantity"
                                        name="stock_quantity"
                                        type="number"
                                        className="h-12 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-amber-500/20 font-medium"
                                        value={formData.stock_quantity}
                                        onChange={handleChange}
                                        required
                                        min="0"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden">
                        <CardHeader className="border-b border-gray-50 bg-gray-50/30">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-amber-500" />
                                Pricing & Valuation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-8">
                            <div className="grid gap-8 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="original_price" className="text-xs font-bold uppercase tracking-widest text-gray-400">Listing Price (₹)</Label>
                                    <Input
                                        id="original_price"
                                        name="original_price"
                                        type="number"
                                        placeholder="0.00"
                                        className="h-12 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-amber-500/20 font-medium"
                                        value={formData.original_price}
                                        onChange={handleChange}
                                    />
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Before discounts (optional)</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="price" className="text-xs font-bold uppercase tracking-widest text-gray-400">Selling Price (₹)</Label>
                                    <Input
                                        id="price"
                                        name="price"
                                        type="number"
                                        placeholder="0.00"
                                        className="h-12 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-amber-500/20 font-bold text-amber-600 text-lg"
                                        value={formData.price}
                                        onChange={handleChange}
                                        required
                                    />
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Actual price the user pays</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Visuals */}
                <div className="space-y-8">
                    <Card className="border-none shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden">
                        <CardHeader className="border-b border-gray-50 bg-gray-50/30">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <ImageIcon className="h-5 w-5 text-amber-500" />
                                Media Assets
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-8 space-y-6">
                            <div className="space-y-4">
                                <CloudinaryUpload
                                    onUpload={handleImageUpload}
                                    maxFiles={4}
                                    currentCount={images.length}
                                />
                                <ImageReorder
                                    images={images}
                                    setImages={setImages}
                                    onRemove={handleRemoveImage}
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed text-center">
                                Upload up to 4 high-resolution images.<br />The first image will be your main display.
                            </p>
                        </CardContent>
                    </Card>

                    <div className="sticky top-24 pt-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-16 rounded-3xl bg-gradient-to-r from-amber-500 to-amber-700 text-white font-bold text-lg shadow-2xl shadow-amber-500/40 border-none hover:translate-y-[-4px] active:scale-95 transition-all"
                        >
                            {loading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                <>
                                    <Save className="mr-2 h-5 w-5" />
                                    {isEditMode ? "Update Collection" : "Commit to Store"}
                                </>
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full mt-4 h-12 rounded-2xl text-gray-400 font-bold hover:bg-gray-100/50"
                            onClick={() => navigate(isComboMode ? "/admin/combos" : "/admin/products")}
                            disabled={loading}
                        >
                            <X className="mr-2 h-4 w-4" /> Discard Changes
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AdminProductForm;
