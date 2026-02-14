
import { ShoppingBag, Truck, CheckCircle, XCircle, Clock, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CloudinaryImage } from "@/components/ui/CloudinaryImage";

export interface OrderItem {
    id: string;
    product_name: string;
    product_image: string;
    quantity: number;
    price: number;
}

export interface Order {
    id: string;
    order_number: string;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    total_amount: number;
    created_at: string;
    order_items: OrderItem[];
    tracking_number?: string;
    tracking_url?: string;
}

interface OrderCardProps {
    order: Order;
    onTrackOrder: (order: Order) => void;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'pending':
            return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80";
        case 'processing':
            return "bg-blue-100 text-blue-800 hover:bg-blue-100/80";
        case 'shipped':
            return "bg-purple-100 text-purple-800 hover:bg-purple-100/80";
        case 'delivered':
            return "bg-green-100 text-green-800 hover:bg-green-100/80";
        case 'cancelled':
            return "bg-red-100 text-red-800 hover:bg-red-100/80";
        default:
            return "bg-gray-100 text-gray-800 hover:bg-gray-100/80";
    }
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'pending':
            return <Clock className="w-4 h-4 mr-1" />;
        case 'processing':
            return <Package className="w-4 h-4 mr-1" />;
        case 'shipped':
            return <Truck className="w-4 h-4 mr-1" />;
        case 'delivered':
            return <CheckCircle className="w-4 h-4 mr-1" />;
        case 'cancelled':
            return <XCircle className="w-4 h-4 mr-1" />;
        default:
            return <ShoppingBag className="w-4 h-4 mr-1" />;
    }
};

export const OrderCard = ({ order, onTrackOrder }: OrderCardProps) => {
    return (
        <Card className="overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="p-4 bg-muted/30 flex flex-row items-center justify-between">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">Order #{order.order_number}</span>
                        <Badge variant="secondary" className={getStatusColor(order.status)}>
                            {getStatusIcon(order.status)}
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        Placed on {new Date(order.created_at).toLocaleDateString()}
                    </span>
                </div>
                <div className="text-right">
                    <span className="font-bold text-lg">₹{order.total_amount.toLocaleString()}</span>
                </div>
            </CardHeader>

            <CardContent className="p-4">
                <div className="flex flex-col gap-4">
                    {order.order_items && order.order_items.map((item) => (
                        <div key={item.id} className="flex items-start gap-4">
                            <div className="h-16 w-16 overflow-hidden rounded-md border bg-muted">
                                {item.product_image ? (
                                    <CloudinaryImage
                                        src={item.product_image || '/placeholder.svg'}
                                        alt={item.product_name || "Product"}
                                        className="h-full w-full object-cover"
                                        width={64}
                                        height={64}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                        <ShoppingBag className="w-6 h-6 text-gray-300" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-medium text-sm line-clamp-2">{item.product_name}</h4>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Qty: {item.quantity} × ₹{item.price.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    ))}

                    {order.tracking_number && (
                        <div className="mt-2 p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4 text-primary" />
                                <span className="text-xs font-medium">Tracking ID: {order.tracking_number}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[10px] font-bold uppercase tracking-wider"
                                onClick={() => onTrackOrder(order)}
                            >
                                Track Now
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>

            <Separator />

            <CardFooter className="p-4 bg-muted/10 flex justify-between items-center">
                <div className="text-xs text-muted-foreground">
                    {order.order_items?.length || 0} {order.order_items?.length === 1 ? 'Item' : 'Items'}
                </div>
                <div className="flex gap-3">
                    {(order.status === 'shipped' || order.status === 'delivered') && (
                        <Button size="sm" variant="outline" onClick={() => onTrackOrder(order)}>
                            <Truck className="w-4 h-4 mr-2" />
                            Track Order
                        </Button>
                    )}
                    {order.status === 'delivered' && (
                        <Button size="sm" variant="outline">
                            Write Review
                        </Button>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
};
