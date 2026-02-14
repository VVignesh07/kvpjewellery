
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { Order } from "./OrderCard";

interface OrderTrackingProps {
    order: Order | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const OrderTracking = ({ order, open, onOpenChange }: OrderTrackingProps) => {
    if (!order) return null;

    const steps = [
        { status: 'pending', label: 'Order Placed', date: order.created_at },
        { status: 'processing', label: 'Processing', date: null },
        { status: 'shipped', label: 'Shipped', date: null },
        { status: 'delivered', label: 'Delivered', date: null },
    ];

    const getCurrentStep = () => {
        switch (order.status) {
            case 'pending': return 0;
            case 'processing': return 1;
            case 'shipped': return 2;
            case 'delivered': return 3;
            case 'cancelled': return -1;
            default: return 0;
        }
    };

    const currentStep = getCurrentStep();

    const copyTracking = () => {
        if (order.tracking_number) {
            navigator.clipboard.writeText(order.tracking_number);
            toast.success("Tracking number copied to clipboard");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Track Order #{order.order_number}</DialogTitle>
                    <DialogDescription>
                        View current status and tracking information
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {/* Tracking Number Section */}
                    {order.tracking_number && (
                        <div className="bg-muted p-4 rounded-lg mb-6 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Tracking Number</p>
                                <p className="font-mono font-medium">{order.tracking_number}</p>
                            </div>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={copyTracking}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {/* Timeline */}
                    {order.status === 'cancelled' ? (
                        <div className="text-center p-4 bg-red-50 text-red-800 rounded-lg">
                            <p className="font-bold">Order Cancelled</p>
                            <p className="text-sm mt-1">This order has been cancelled.</p>
                        </div>
                    ) : (
                        <div className="relative pl-4 border-l-2 border-muted space-y-8 ml-2">
                            {steps.map((step, index) => {
                                const isCompleted = index <= currentStep;
                                const isCurrent = index === currentStep;

                                return (
                                    <div key={step.label} className="relative">
                                        <div
                                            className={`absolute -left-[21px] top-0 h-4 w-4 rounded-full border-2 ${isCompleted
                                                    ? "bg-primary border-primary"
                                                    : "bg-background border-muted"
                                                } flex items-center justify-center`}
                                        >
                                            {isCompleted && <div className="h-2 w-2 rounded-full bg-primary-foreground" />}
                                        </div>

                                        <div className={isCompleted ? "text-foreground" : "text-muted-foreground"}>
                                            <p className={`text-sm font-medium ${isCurrent ? "text-primary font-bold" : ""}`}>
                                                {step.label}
                                            </p>
                                            {index === 0 && (
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(step.date!).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {order.tracking_url && (
                    <Button className="w-full mt-2" onClick={() => window.open(order.tracking_url, '_blank')}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Track on Courier Website
                    </Button>
                )}
            </DialogContent>
        </Dialog>
    );
};
