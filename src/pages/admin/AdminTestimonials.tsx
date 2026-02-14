
import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Edit, Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";

interface Testimonial {
    id: string;
    name: string;
    role: string;
    content: string;
    rating: number;
    is_active: boolean;
    created_at: string;
    product_id?: string;
    products?: {
        name: string;
    };
}

const AdminTestimonials = () => {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Delete Confirmation State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Modal State
    const [isOpen, setIsOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        role: "Customer",
        content: "",
        rating: "5",
        is_active: true
    });

    useEffect(() => {
        fetchTestimonials();

        // Realtime subscription for testimonials
        const channel = supabaseAdmin
            .channel('admin-testimonials-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'testimonials'
                },
                () => {
                    fetchTestimonials();
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

    const fetchTestimonials = async () => {
        setLoading(true);
        // We use a join to get the product name if it exists
        const { data, error } = await supabaseAdmin
            .from('testimonials')
            .select('*, products(name)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("❌ AdminTestimonials - Error details:", {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            toast.error(`Fetch Error: ${error.message}`);
        } else {
            setTestimonials(data || []);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.content) {
            toast.error("Name and Content are required");
            return;
        }

        const payload = {
            name: formData.name,
            role: formData.role,
            content: formData.content,
            rating: parseInt(formData.rating),
            is_active: formData.is_active
        };

        try {
            if (editingId) {
                const { error } = await supabaseAdmin
                    .from('testimonials')
                    .update(payload)
                    .eq('id', editingId);
                if (error) throw error;
                toast.success("Testimonial updated");
            } else {
                const { error } = await supabaseAdmin
                    .from('testimonials')
                    .insert([payload]);
                if (error) throw error;
                toast.success("Testimonial added");
            }

            setIsOpen(false);
            resetForm();
            fetchTestimonials();
        } catch (error) {
            console.error("Error saving:", error);
            const message = error instanceof Error ? error.message : "Failed to save";
            toast.error(message);
        }
    };

    const confirmDelete = (id: string) => {
        setDeleteId(id);
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            const { error } = await supabaseAdmin
                .from('testimonials')
                .delete()
                .eq('id', deleteId);

            if (error) throw error;
            toast.success("Testimonial deleted");
            setTestimonials(prev => prev.filter(t => t.id !== deleteId));
        } catch (error) {
            console.error("Error deleting:", error);
            toast.error("Failed to delete");
        } finally {
            setDeleteId(null);
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabaseAdmin
                .from('testimonials')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;

            setTestimonials(prev => prev.map(t =>
                t.id === id ? { ...t, is_active: !currentStatus } : t
            ));
            toast.success(`Testimonial ${!currentStatus ? 'enabled' : 'disabled'}`);
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status");
        }
    };

    const openEdit = (testimonial: Testimonial) => {
        setEditingId(testimonial.id);
        setFormData({
            name: testimonial.name,
            role: testimonial.role || "Customer",
            content: testimonial.content,
            rating: testimonial.rating.toString(),
            is_active: testimonial.is_active
        });
        setIsOpen(true);
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            name: "",
            role: "Customer",
            content: "",
            rating: "5",
            is_active: true
        });
    };

    const filteredTestimonials = testimonials.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Testimonials</h2>
                    <p className="text-muted-foreground">Manage customer reviews and feedback</p>
                </div>
                <Button onClick={() => { resetForm(); setIsOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Add Testimonial
                </Button>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search reviews..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTestimonials.map((item) => (
                    <div key={item.id} className={`group relative flex flex-col justify-between rounded-lg border p-6 hover:shadow-md transition-shadow ${!item.is_active ? 'bg-muted/50 opacity-75' : 'bg-card'}`}>
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                                        {item.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-sm leading-none">{item.name}</h3>
                                            {!item.is_active && (
                                                <span className="bg-rose-100 text-rose-600 text-[10px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter animate-pulse">
                                                    New Review
                                                </span>
                                            )}
                                        </div>
                                        {item.products?.name ? (
                                            <p className="text-[10px] text-amber-600 font-bold mt-1 uppercase tracking-tight">
                                                Review for: {item.products.name}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-muted-foreground mt-1">{item.role}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-3 h-3 ${i < item.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="relative">
                                <MessageSquare className="absolute -top-1 -left-1 w-3 h-3 text-primary/20" />
                                <p className="text-sm text-muted-foreground line-clamp-3 pl-4 italic">
                                    "{item.content}"
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-6 mt-2 border-t">
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={item.is_active}
                                    onCheckedChange={() => toggleStatus(item.id, item.is_active)}
                                />
                                <span className="text-xs text-muted-foreground">
                                    {item.is_active ? "Active" : "Hidden"}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(item)}>
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive/70 hover:text-destructive" onClick={() => confirmDelete(item.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit/Add Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Testimonial" : "Add Testimonial"}</DialogTitle>
                        <DialogDescription>
                            Customer reviews will be displayed on the home page.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Customer Name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role (Optional)</Label>
                                <Input
                                    id="role"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    placeholder="e.g. Verified Buyer"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rating">Rating</Label>
                            <Select
                                value={formData.rating}
                                onValueChange={(val) => setFormData({ ...formData, rating: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Rating" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">5 Stars - Excellent</SelectItem>
                                    <SelectItem value="4">4 Stars - Good</SelectItem>
                                    <SelectItem value="3">3 Stars - Average</SelectItem>
                                    <SelectItem value="2">2 Stars - Poor</SelectItem>
                                    <SelectItem value="1">1 Star - Terrible</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="content">Review Content</Label>
                            <Textarea
                                id="content"
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                placeholder="Write the customer's review here..."
                                rows={4}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                id="active-mode"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                            />
                            <Label htmlFor="active-mode">Visible on Website</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the testimonial.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
};

export default AdminTestimonials;
