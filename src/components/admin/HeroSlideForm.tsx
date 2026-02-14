
import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CloudinaryUpload } from "./CloudinaryUpload";
import { X, Loader2, Image as ImageIcon, Type, MousePointer2, Settings2, Info, Trash2 } from "lucide-react";

interface HeroSlide {
    id?: string;
    image_url: string;
    title: string | null;
    subtitle: string | null;
    button_text: string | null;
    button_link: string | null;
    display_order: number;
    is_active: boolean;
}

interface HeroSlideFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    slide: HeroSlide | null;
    onSubmit: (data: any) => Promise<void>;
    loading: boolean;
}

export const HeroSlideForm = ({
    open,
    onOpenChange,
    slide,
    onSubmit,
    loading,
}: HeroSlideFormProps) => {
    const [formData, setFormData] = useState<HeroSlide>({
        image_url: "",
        title: "",
        subtitle: "",
        button_text: "SHOP NOW",
        button_link: "/shop",
        display_order: 0,
        is_active: true,
    });

    useEffect(() => {
        if (open) {
            if (slide) {
                setFormData(slide);
            } else {
                setFormData({
                    image_url: "",
                    title: "",
                    subtitle: "",
                    button_text: "SHOP NOW",
                    button_link: "/shop",
                    display_order: 0,
                    is_active: true,
                });
            }
        }
    }, [slide, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{slide ? "Edit Hero Slide" : "Add Hero Slide"}</DialogTitle>
                    <DialogDescription>
                        {slide ? "Update the images and text for this hero slide." : "Create a new slide for the homepage carousel."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-8 pt-6">
                    {/* Visual Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.15em] text-[10px]">
                                <ImageIcon className="w-3.5 h-3.5" />
                                Visual Content
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                <Info className="w-3 h-3" />
                                Recommended: 21:9 Ratio (1920x820)
                            </div>
                        </div>

                        {formData.image_url ? (
                            <div className="relative aspect-[21/9] w-full bg-muted rounded-2xl overflow-hidden group border-2 border-primary/10 shadow-inner">
                                <img
                                    src={formData.image_url}
                                    alt="Slide Preview"
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                    <button
                                        type="button"
                                        onClick={() => setFormData((prev) => ({ ...prev, image_url: "" }))}
                                        className="bg-rose-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold shadow-xl hover:bg-rose-600 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Replace Image
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <CloudinaryUpload
                                onUpload={(url) => setFormData((prev) => ({ ...prev, image_url: url }))}
                                maxFiles={1}
                            />
                        )}
                    </div>

                    {/* Text Content Section */}
                    <div className="space-y-4 pt-4 border-t border-muted/50">
                        <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.15em] text-[10px]">
                            <Type className="w-3.5 h-3.5" />
                            Slide Text / Overlay
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Main Title</Label>
                                <Input
                                    id="title"
                                    value={formData.title || ""}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                                    placeholder="e.g. Elegance That Shines"
                                    className="rounded-xl border-muted-foreground/20 focus:ring-primary/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="display_order" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Order Position</Label>
                                <Input
                                    id="display_order"
                                    type="number"
                                    value={formData.display_order}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                                    className="rounded-xl border-muted-foreground/20 focus:ring-primary/20"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subtitle" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Subtitle / Description</Label>
                            <Textarea
                                id="subtitle"
                                value={formData.subtitle || ""}
                                onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
                                placeholder="Describe this slide collection..."
                                rows={3}
                                className="rounded-xl border-muted-foreground/20 focus:ring-primary/20 resize-none"
                            />
                        </div>
                    </div>

                    {/* Button Action Section */}
                    <div className="space-y-4 pt-4 border-t border-muted/50">
                        <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.15em] text-[10px]">
                            <MousePointer2 className="w-3.5 h-3.5" />
                            Call to Action
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="button_text" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Button Label</Label>
                                <Input
                                    id="button_text"
                                    value={formData.button_text || ""}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, button_text: e.target.value }))}
                                    placeholder="SHOP NOW"
                                    className="rounded-xl border-muted-foreground/20 focus:ring-primary/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="button_link" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Navigate To</Label>
                                <Input
                                    id="button_link"
                                    value={formData.button_link || ""}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, button_link: e.target.value }))}
                                    placeholder="/shop"
                                    className="rounded-xl border-muted-foreground/20 focus:ring-primary/20"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Status & Settings */}
                    <div className="space-y-4 pt-4 border-t border-muted/50">
                        <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.15em] text-[10px]">
                            <Settings2 className="w-3.5 h-3.5" />
                            Configuration
                        </div>

                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-muted-foreground/10">
                            <div className="flex flex-col space-y-1">
                                <Label htmlFor="is_active" className="text-sm font-bold">Active Status</Label>
                                <span className="text-[10px] text-muted-foreground">
                                    Determines if this slide is visible to customers.
                                </span>
                            </div>
                            <Switch
                                id="is_active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
                            />
                        </div>
                    </div>

                    <DialogFooter className="sticky bottom-0 bg-background pt-6 mt-6 border-t border-muted-foreground/10 pb-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                            className="rounded-xl font-bold"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !formData.image_url}
                            className="rounded-xl px-8 gradient-gold text-primary-foreground font-black tracking-widest text-xs shadow-gold hover:shadow-elevated transition-all"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                    SAVING...
                                </>
                            ) : (
                                "PUBLISH SLIDE"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
