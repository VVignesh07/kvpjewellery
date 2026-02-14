import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, X } from "lucide-react";
import { CloudinaryUpload } from "./CloudinaryUpload";

interface CategoryFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    category?: {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        image_url: string | null;
        is_active: boolean;
    } | null;
    onSubmit: (data: {
        name: string;
        slug: string;
        description: string;
        image_url: string;
        is_active: boolean;
    }) => Promise<void>;
    loading: boolean;
}

export const CategoryForm = ({ open, onOpenChange, category, onSubmit, loading }: CategoryFormProps) => {
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        is_active: true,
    });
    const [images, setImages] = useState<string[]>([]);

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name,
                slug: category.slug,
                description: category.description || "",
                is_active: category.is_active,
            });
            setImages(category.image_url ? [category.image_url] : []);
        } else {
            setFormData({
                name: "",
                slug: "",
                description: "",
                is_active: true,
            });
            setImages([]);
        }
    }, [category, open]);

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");
    };

    const handleNameChange = (name: string) => {
        setFormData({
            ...formData,
            name,
            slug: generateSlug(name),
        });
    };

    const handleImageUpload = (url: string) => {
        console.log('📥 CategoryForm handleImageUpload:', url);
        setImages([url]); // Only allow 1 image for category but use array pattern
    };

    const handleRemoveImage = () => {
        setImages([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const submitData = {
            ...formData,
            image_url: images.length > 0 ? images[0] : ""
        };
        console.log('🚀 Submitting category with data:', submitData);
        await onSubmit(submitData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{category ? "Edit Category" : "Add New Category"}</DialogTitle>
                    <DialogDescription>
                        {category ? "Modify the details of an existing category." : "Fill in the details to create a new product category."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Category Name *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="e.g., Earrings"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug *</Label>
                        <Input
                            id="slug"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            placeholder="e.g., earrings"
                            required
                        />
                        <p className="text-xs text-muted-foreground">URL-friendly version of the name</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief description of this category"
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Category Image</Label>
                        <CloudinaryUpload
                            onUpload={handleImageUpload}
                            currentCount={images.length}
                            maxFiles={1}
                        />
                        {images.length > 0 && (
                            <div className="mt-2 relative group">
                                <div className="relative w-full h-32 rounded-md overflow-hidden bg-muted">
                                    <img
                                        src={images[0]}
                                        alt="Category preview"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="absolute top-2 right-2 p-1 bg-destructive/90 text-destructive-foreground rounded-full shadow-md z-10 hover:bg-destructive transition-colors"
                                    title="Remove image"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="is_active">Active Status</Label>
                        <Switch
                            id="is_active"
                            checked={formData.is_active}
                            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                category ? "Update Category" : "Add Category"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
