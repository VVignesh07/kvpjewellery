import { useState, useEffect } from "react";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { CategoryForm } from "@/components/admin/CategoryForm";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    is_active: boolean;
    display_order: number;
    created_at: string;
}

const AdminCategories = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchCategories();

        // REALTIME: Listen for category changes (same pattern as products)
        const channel = supabaseAdmin
            .channel('admin-categories-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'categories'
                },
                (payload) => {
                    console.log('📂 Realtime category update:', payload);
                    fetchCategories();
                }
            )
            .subscribe();

        return () => {
            if (channel) {
                const cleanup = async () => {
                    try {
                        if (channel.state !== 'closed' && channel.state !== 'errored') {
                            await supabaseAdmin.removeChannel(channel).catch((err) => {
                                console.log('📦 Realtime cleanup info (categories):', err.message || err);
                            });
                        }
                    } catch (e) {
                        // Silent fail
                    }
                };
                cleanup();
            }
        };
    }, []);

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabaseAdmin
                .from("categories")
                .select("*")
                .order("display_order", { ascending: true });

            if (error) throw error;
            console.log('✅ Loaded', data?.length, 'categories');
            if (data && data.length > 0) {
                console.log('📋 Database Columns:', Object.keys(data[0]));
                console.log('📸 Categories:', data.map(c => ({
                    name: c.name,
                    has_image: !!c.image_url,
                    image_url: c.image_url ? c.image_url.substring(0, 60) + '...' : 'NO IMAGE'
                })));
            }
            setCategories(data || []);
        } catch (error) {
            console.error('❌ Error fetching categories:', error);
            toast.error("Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = () => {
        setSelectedCategory(null);
        setFormOpen(true);
    };

    const handleEditCategory = (category: Category) => {
        setSelectedCategory(category);
        setFormOpen(true);
    };

    const handleSubmit = async (formData: {
        name: string;
        slug: string;
        description: string;
        image_url: string;
        is_active: boolean;
    }) => {
        setSubmitting(true);
        console.log('💾 AdminCategories full submit data:', formData);

        try {
            // Explicitly construct the data object to match DB schema
            const dbData = {
                name: formData.name,
                slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
                description: formData.description,
                image_url: formData.image_url,
                is_active: formData.is_active,
                updated_at: new Date().toISOString()
            };

            if (selectedCategory) {
                console.log('📝 Updating category ID:', selectedCategory.id, 'with:', dbData);
                const { data, error } = await supabaseAdmin
                    .from("categories")
                    .update(dbData)
                    .eq("id", selectedCategory.id)
                    .select();

                if (error) {
                    toast.error("Failed to update category: " + error.message);
                    console.error('❌ Update error:', error);
                } else if (!data || data.length === 0) {
                    console.error('⚠️ Update successful but no data returned. Check RLS or ID correctness.');
                    toast.error("Update failed: No record was changed");
                } else {
                    console.log('✅ Category updated successfully, returned data:', data[0]);
                    toast.success("Category updated successfully!");
                    setFormOpen(false);
                    // Force state update to reflect changes immediately
                    setCategories(prev => prev.map(c => c.id === selectedCategory.id ? { ...c, ...data[0] } : c));
                    // Also refetch for absolute certainty
                    await fetchCategories();
                }
            } else {
                console.log('➕ Inserting new category:', dbData);
                const { data, error } = await supabaseAdmin
                    .from("categories")
                    .insert([dbData])
                    .select();

                if (error) {
                    toast.error("Failed to add category: " + error.message);
                    console.error('❌ Insert error:', error);
                } else {
                    console.log('✅ Category added successfully, returned data:', data?.[0]);
                    toast.success("New category added!");
                    setFormOpen(false);
                    if (data?.[0]) {
                        setCategories(prev => [...prev, data[0]]);
                    }
                    await fetchCategories();
                }
            }
        } catch (err) {
            console.error('💥 Unexpected submission error:', err);
            toast.error("An unexpected error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteClick = (categoryId: string) => {
        console.log('🗑️ Delete clicked for:', categoryId);
        setCategoryToDelete(categoryId);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!categoryToDelete) return;

        try {
            const { error } = await supabaseAdmin
                .from("categories")
                .delete()
                .eq("id", categoryToDelete);

            if (error) {
                toast.error("Failed to delete category");
                console.error(error);
            } else {
                toast.success("Category deleted!");
                setCategories(prev => prev.filter(c => c.id !== categoryToDelete));
            }
        } finally {
            setDeleteDialogOpen(false);
            setCategoryToDelete(null);
        }
    };

    const handleToggleStatus = async (category: Category) => {
        try {
            const { error } = await supabaseAdmin
                .from("categories")
                .update({ is_active: !category.is_active })
                .eq("id", category.id);

            if (error) {
                toast.error("Failed to update status");
                console.error(error);
            } else {
                toast.success(`Category ${!category.is_active ? "activated" : "deactivated"}`);
                // Optimistic update
                setCategories(prev => prev.map(c =>
                    c.id === category.id ? { ...c, is_active: !c.is_active } : c
                ));
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to update status");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading categories...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
                    <p className="text-muted-foreground">Manage product categories</p>
                </div>
                <Button onClick={handleAddCategory} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Category
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                    <Card key={category.id} className="overflow-hidden">
                        <CardHeader className="p-0">
                            {category.image_url ? (
                                <div className="relative w-full h-48 bg-muted">
                                    <img
                                        src={category.image_url}
                                        alt={category.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-full h-48 bg-muted flex items-center justify-center">
                                    <ImageIcon className="w-12 h-12 text-muted-foreground" />
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">{category.name}</CardTitle>
                                        <p className="text-sm text-muted-foreground">/{category.slug}</p>
                                    </div>
                                    <Badge variant={category.is_active ? "default" : "secondary"}>
                                        {category.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                </div>

                                {category.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {category.description}
                                    </p>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">Status:</span>
                                        <Switch
                                            checked={category.is_active}
                                            onCheckedChange={() => handleToggleStatus(category)}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEditCategory(category)}
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeleteClick(category.id)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {categories.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
                        <p className="text-muted-foreground mb-4">Get started by creating your first category</p>
                        <Button onClick={handleAddCategory} className="gap-2">
                            <Plus className="w-4 h-4" />
                            Add Category
                        </Button>
                    </CardContent>
                </Card>
            )}

            <CategoryForm
                open={formOpen}
                onOpenChange={setFormOpen}
                category={selectedCategory}
                onSubmit={handleSubmit}
                loading={submitting}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the category.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default AdminCategories;
