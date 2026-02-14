
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { CloudinaryImage } from "@/components/ui/CloudinaryImage";
import { Loader2, Star } from "lucide-react";

interface Product {
    id: string;
    name: string;
    price: number;
    image_url: string;
    category: string;
    stock: string;
    original_price?: number;
    avg_rating?: number;
    review_count?: number;
}

interface RelatedProductsProps {
    currentProductId: string;
    category: string;
}

const RelatedProducts = ({ currentProductId, category }: RelatedProductsProps) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRelated = async () => {
            setLoading(true);
            try {
                // 1. Try to fetch by category first
                let { data, error } = await supabase
                    .from('products')
                    .select('id, name, price, original_price, image_url, category, stock, avg_rating, review_count')
                    .eq('category', category)
                    .neq('id', currentProductId)
                    .limit(4);

                if (error) throw error;

                // 2. If no products found in category, fetch random ones
                if (!data || data.length === 0) {
                    const { data: fallbackData, error: fallbackError } = await supabase
                        .from('products')
                        .select('id, name, price, original_price, image_url, category, stock, avg_rating, review_count')
                        .neq('id', currentProductId)
                        .limit(4);

                    if (fallbackError) throw fallbackError;
                    setProducts(fallbackData || []);
                } else {
                    setProducts(data);
                }
            } catch (err) {
                console.error("Error fetching related products:", err);
            } finally {
                setLoading(false);
            }
        };

        if (category !== undefined) {
            fetchRelated();
        }
    }, [category, currentProductId]);

    if (loading) return <div className="py-10 flex justify-center"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>;
    if (products.length === 0) return null;

    return (
        <div className="py-12 border-t mt-12">
            <h3 className="text-2xl font-bold font-heading mb-6">Related Products</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {products.map((product) => (
                    <Link key={product.id} to={`/product/${product.id}`} className="group block bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                        <div className="aspect-square relative overflow-hidden">
                            <CloudinaryImage
                                src={product.image_url || '/placeholder.svg'}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                                {product.stock !== "In Stock" && (
                                    <span className="bg-black/60 text-white text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider backdrop-blur-sm shadow-sm">
                                        {product.stock === "Low Stock" ? "Low Stock" : "Sold Out"}
                                    </span>
                                )}
                                {product.original_price && product.original_price > product.price && (
                                    <span className="bg-primary text-primary-foreground text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider shadow-md">
                                        {Math.round(((product.original_price - product.price) / product.original_price) * 100)}% OFF
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="p-4">
                            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{product.category}</p>
                            <h4 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors text-sm">
                                {product.name}
                            </h4>
                            <div className="flex items-center justify-between mt-1">
                                <div className="flex flex-col">
                                    <p className="text-primary font-bold text-sm">₹{product.price.toLocaleString("en-IN")}</p>
                                    {product.original_price && product.original_price > product.price && (
                                        <p className="text-[10px] text-muted-foreground line-through opacity-70">₹{product.original_price.toLocaleString("en-IN")}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded-md self-end">
                                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                    <span className="text-[10px] font-bold text-amber-700">
                                        {product.avg_rating ? Number(product.avg_rating).toFixed(1) : "5.0"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default RelatedProducts;
