const WHATSAPP_NUMBER = "918825564893";

interface OrderDetails {
  products: {
    name: string;
    price: number;
    quantity: number;
  }[];
  total: number;
  shippingFee: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  orderId?: string; // Added optional Order ID
};

export const generateWhatsAppOrderUrl = (order: OrderDetails) => {
  const productLines = order.products
    .map((p) => `• ${p.name} x${p.quantity} — ₹${p.price.toLocaleString("en-IN")}`)
    .join("\n");

  const subtotal = order.total - order.shippingFee;

  let message = `*New Order Request* 🛍️\n\n`;
  if (order.orderId) {
    message += `*Order ID:* ${order.orderId}\n\n`;
  }
  message += `*Customer Details:*\nName: ${order.customerName}\nPhone: ${order.customerPhone}\nAddress: ${order.customerAddress}\n\n`;
  message += `*Order Items:*\n${productLines}\n\n`;

  if (order.shippingFee > 0) {
    message += `*Subtotal:* ₹${subtotal.toLocaleString("en-IN")}\n`;
    message += `*Shipping:* ₹${order.shippingFee.toLocaleString("en-IN")}\n`;
  } else {
    message += `*Shipping:* FREE\n`;
  }

  message += `*Total: ₹${order.total.toLocaleString("en-IN")}*\n\n`;
  message += `UPI ID: balasundarimurugesan@ybl\n\n`;
  message += `*⚠️ PLEASE ATTACH YOUR PAYMENT SCREENSHOT BELOW*`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};

export const generateProductWhatsAppUrl = (productName: string, price: number) => {
  const message = `Hi KVP JEWELLERY,
I'm interested in:

*${productName}* — ₹${price.toLocaleString("en-IN")}

Please share more details.`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};

export const generateCustomerWhatsAppUrl = (phone: string) => {
  // Remove non-digit characters
  const cleaned = phone.replace(/\D/g, "");
  // Add 91 prefix if not present and is a 10-digit number
  const formatted = (cleaned.length === 10) ? `91${cleaned}` : cleaned;

  return `https://wa.me/${formatted}`;
};

export const generateOrderConfirmationUrl = (orderNumber: string, customerName: string, phone: string) => {
  const message = `Hi ${customerName}, thank you for shopping with KVP JEWELLERY shop! 🌟

Your order #${orderNumber} has been confirmed. We will update you once it's shipped.

Thank you!`;

  return `${generateCustomerWhatsAppUrl(phone)}?text=${encodeURIComponent(message)}`;
};

export const generateTrackingInquiryUrl = (trackingNumber: string) => {
  const message = `Hi KVP JEWELLERY, I'd like to inquire about my order tracking status. 
  
My Tracking Number/Order ID is: *${trackingNumber}*`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};
