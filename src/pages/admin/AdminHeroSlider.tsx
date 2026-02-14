
import { useState, useEffect } from "react";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Layout, ExternalLink, MoveUp, MoveDown, Eye, EyeOff, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { HeroSlideForm } from "@/components/admin/HeroSlideForm";
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

interface HeroSlide {
    id: string;
    image_url: string;
    title: string | null;
    subtitle: string | null;
    button_text: string | null;
    button_link: string | null;
    display_order: number;
    is_active: boolean;
    created_at: string;
}

const AdminHeroSlider = () => {
    const [slides, setSlides] = useState<HeroSlide[]>([]);
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedSlide, setSelectedSlide] = useState<HeroSlide | null>(null);
    const [slideToDelete, setSlideToDelete] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchSlides();

        const channel = supabaseAdmin
            .channel('admin-hero-slides-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'hero_slides'
                },
                () => {
                    fetchSlides();
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
    }, []);

    const fetchSlides = async () => {
        try {
            const { data, error } = await supabaseAdmin
                .from("hero_slides")
                .select("*")
                .order("display_order", { ascending: true });

            if (error) throw error;
            setSlides(data || []);
        } catch (error) {
            console.error('Error fetching slides:', error);
            toast.error("Failed to load hero slides");
        } finally {
            setLoading(false);
        }
    };

    const handleAddSlide = () => {
        setSelectedSlide(null);
        setFormOpen(true);
    };

    const handleEditSlide = (slide: HeroSlide) => {
        setSelectedSlide(slide);
        setFormOpen(true);
    };

    const handleSubmit = async (formData: any) => {
        setSubmitting(true);
        try {
            const dbData = {
                image_url: formData.image_url,
                title: formData.title,
                subtitle: formData.subtitle,
                button_text: formData.button_text,
                button_link: formData.button_link,
                display_order: formData.display_order,
                is_active: formData.is_active,
                updated_at: new Date().toISOString()
            };

            if (selectedSlide) {
                const { error } = await supabaseAdmin
                    .from("hero_slides")
                    .update(dbData)
                    .eq("id", selectedSlide.id);

                if (error) throw error;
                toast.success("Slide updated successfully");
            } else {
                const { error } = await supabaseAdmin
                    .from("hero_slides")
                    .insert([dbData]);

                if (error) throw error;
                toast.success("New slide added successfully");
            }
            setFormOpen(false);
            fetchSlides();
        } catch (error: any) {
            toast.error(error.message || "Failed to save slide");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteClick = (id: string) => {
        setSlideToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!slideToDelete) return;
        try {
            const { error } = await supabaseAdmin
                .from("hero_slides")
                .delete()
                .eq("id", slideToDelete);

            if (error) throw error;
            toast.success("Slide deleted successfully");
            setSlides(prev => prev.filter(s => s.id !== slideToDelete));
        } catch (error: any) {
            toast.error(error.message || "Failed to delete slide");
        } finally {
            setDeleteDialogOpen(false);
            setSlideToDelete(null);
        }
    };

    const handleToggleStatus = async (slide: HeroSlide) => {
        try {
            const { error } = await supabaseAdmin
                .from("hero_slides")
                .update({ is_active: !slide.is_active })
                .eq("id", slide.id);

            if (error) throw error;
            toast.success(`Slide ${!slide.is_active ? "activated" : "deactivated"}`);
            // Optimistic update
            setSlides(prev => prev.map(s => s.id === slide.id ? { ...s, is_active: !s.is_active } : s));
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading slides...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Hero Slider</h1>
                    <p className="text-muted-foreground">Manage homepage hero slides</p>
                </div>
                <Button onClick={handleAddSlide} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Slide
                </Button>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                {slides.map((slide) => (
                    <Card key={slide.id} className="overflow-hidden flex flex-col group border-border/40 hover:border-primary/40 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 bg-card/50 backdrop-blur-sm">
                        <CardHeader className="p-0 relative">
                            <div className="relative aspect-[21/9] bg-muted overflow-hidden">
                                <img
                                    src={slide.image_url}
                                    alt={slide.title || "Hero Slide"}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

                                <div className="absolute top-4 right-4 flex gap-2">
                                    {slide.is_active ? (
                                        <div className="flex items-center gap-1.5 bg-green-500/90 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full backdrop-blur-md shadow-lg border border-white/20 tracking-widest">
                                            <Eye className="w-3 h-3" />
                                            Active
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 bg-gray-500/90 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full backdrop-blur-md shadow-lg border border-white/20 tracking-widest">
                                            <EyeOff className="w-3 h-3" />
                                            Inactive
                                        </div>
                                    )}
                                </div>

                                <div className="absolute bottom-4 left-4 right-4 text-white z-10">
                                    <div className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-primary mb-1">
                                        Slide #{slide.display_order}
                                    </div>
                                    <CardTitle className="text-xl font-black tracking-tight leading-tight line-clamp-1 drop-shadow-md">
                                        {slide.title || "Untitled Slide"}
                                    </CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 flex-1 flex flex-col">
                            <div className="space-y-4 flex-1">
                                {slide.subtitle ? (
                                    <p className="text-sm text-muted-foreground line-clamp-2 italic leading-relaxed">
                                        "{slide.subtitle}"
                                    </p>
                                ) : (
                                    <div className="h-10 flex items-center text-xs text-muted-foreground italic opacity-50">
                                        No subtitle provided
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-2 pt-2">
                                    {slide.button_text && (
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20">
                                            <ExternalLink className="w-3 h-3" />
                                            {slide.button_text}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground bg-muted px-3 py-1.5 rounded-xl border border-border/50">
                                        <Layout className="w-3 h-3" />
                                        /{slide.button_link?.replace(/^\//, '') || 'shop'}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-6 border-t border-muted/50 mt-auto">
                                    <div className="flex items-center gap-3">
                                        <Switch
                                            checked={slide.is_active}
                                            onCheckedChange={() => handleToggleStatus(slide)}
                                            className="scale-90"
                                        />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                            {slide.is_active ? "Live" : "Hidden"}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            onClick={() => handleEditSlide(slide)}
                                            className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors border border-border/50"
                                            title="Edit Slide"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            onClick={() => handleDeleteClick(slide.id)}
                                            className="h-9 w-9 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 transition-colors text-muted-foreground border border-border/50"
                                            title="Delete Slide"
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

            {slides.length === 0 && (
                <Card className="border-dashed border-2">
                    <CardContent className="flex flex-col items-center justify-center py-20">
                        <Layout className="w-16 h-16 text-muted-foreground mb-4 opacity-20" />
                        <h3 className="text-xl font-semibold mb-2">No slides found</h3>
                        <p className="text-muted-foreground mb-8 text-center max-w-sm">
                            Create your first hero slide to welcome customers to your store.
                        </p>
                        <Button onClick={handleAddSlide} className="gap-2">
                            <Plus className="w-4 h-4" />
                            Create First Slide
                        </Button>
                    </CardContent>
                </Card>
            )}

            <HeroSlideForm
                open={formOpen}
                onOpenChange={setFormOpen}
                slide={selectedSlide}
                onSubmit={handleSubmit}
                loading={submitting}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Hero Slide?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove this slide from your homepage. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete Slide
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default AdminHeroSlider;
