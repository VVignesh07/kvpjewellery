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
  orderId?: string;
};

const DIVIDER = "----------------------------------------";

export const generateWhatsAppOrderUrl = (order: OrderDetails) => {
  const productLines = order.products
    .map((p) => `• ${p.name} x${p.quantity} — ₹${p.price.toLocaleString("en-IN")}`)
    .join("\n");

  const subtotal = order.total - order.shippingFee;

  let message = `✨ *KVP JEWELLERY - NEW ORDER* ✨\n${DIVIDER}\n\n`;

  if (order.orderId) {
    message += `🛍️ *Order ID:* #${order.orderId}\n\n`;
  }

  message += `👤 *CUSTOMER DETAILS*\n`;
  message += `Name: ${order.customerName}\n`;
  message += `Phone: ${order.customerPhone}\n`;
  message += `📍 Address: ${order.customerAddress}\n\n`;

  message += `💍 *ORDER SUMMARY*\n${productLines}\n\n`;

  if (order.shippingFee > 0) {
    message += `*Subtotal:* ₹${subtotal.toLocaleString("en-IN")}\n`;
    message += `*Shipping:* ₹${order.shippingFee.toLocaleString("en-IN")}\n`;
  } else {
    message += `*Shipping:* FREE\n`;
  }

  message += `💰 *GRAND TOTAL: ₹${order.total.toLocaleString("en-IN")}*\n\n`;
  message += `${DIVIDER}\n`;
  message += `💳 *PAYMENT INFORMATION*\n`;
  message += `UPI ID: balasundarimurugesan@ybl\n\n`;
  message += `⚠️ *ACTION REQUIRED*\nPlease attach your *Payment Screenshot* below to confirm your order.\n\n`;
  message += `Thank you for choosing KVP Jewellery! 🌟`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};

export const generateProductWhatsAppUrl = (productName: string, price: number) => {
  const message = `✨ *KVP JEWELLERY - INQUIRY* ✨\n${DIVIDER}\n\nHi KVP JEWELLERY,\nI'm interested in this piece:\n\n💍 *${productName}*\n💰 Price: ₹${price.toLocaleString("en-IN")}\n\nPlease share more details.`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};

export const generateCustomerWhatsAppUrl = (phone: string) => {
  const cleaned = phone.replace(/\D/g, "");
  const formatted = (cleaned.length === 10) ? `91${cleaned}` : cleaned;
  return `https://wa.me/${formatted}`;
};

export const generateOrderConfirmationUrl = (orderNumber: string, customerName: string) => {
  const message = `🌟 *KVP JEWELLERY - ORDER CONFIRMED* 🌟\n${DIVIDER}\n\nDear *${customerName}*,\n\nWe are delighted to inform you that your order *#${orderNumber}* has been successfully confirmed! 🥳\n\n✨ *What's Next?*\nOur master craftsmen are carefully preparing your selected pieces. We will notify you once your package is shipped with tracking details.\n\n💍 Thank you for trusting KVP Jewellery with your precious moments.\n\nVisit us again: https://kvp-jewellery.vercel.app`;

  return message; // We return the message so it can be used with generateCustomerWhatsAppUrl
};

export const generateShippingUpdateUrl = (orderNumber: string, customerName: string, trackingNumber: string, trackingUrl?: string) => {
  let message = `🚚 *KVP JEWELLERY - ORDER SHIPPED* 🚚\n${DIVIDER}\n\nGreat news, *${customerName}*!\n\nYour order *#${orderNumber}* is on its way to you.\n\n📦 *Tracking Number:* ${trackingNumber}\n`;

  if (trackingUrl) {
    message += `🔗 *Track Here:* ${trackingUrl}\n`;
  }

  message += `\nExpected delivery within 3-5 business days. Get ready to shine! ✨\n\nWith love, KVP Jewellery.`;

  return message;
};

export const generatePaymentReminderUrl = (orderNumber: string, customerName: string, total: number) => {
  const message = `💳 *KVP JEWELLERY - PAYMENT REMINDER* 💳\n${DIVIDER}\n\nHi *${customerName}*,\n\nThis is a gentle reminder regarding payment for your order *#${orderNumber}* (Total: ₹${total.toLocaleString("en-IN")}).\n\nIf you have already made the payment, please share the screenshot here. If not, you can complete it using:\n\n💰 *UPI ID:* balasundarimurugesan@ybl\n\nThank you for choosing us! ✨`;

  return message;
};

export const generateTrackingInquiryUrl = (trackingNumber: string) => {
  const message = `✨ *KVP JEWELLERY - TRACKING INQUIRY* ✨\n${DIVIDER}\n\nHi KVP JEWELLERY, I'd like to inquire about my order tracking status.\n\n📍 My Tracking Number/Order ID is: *${trackingNumber}*`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};
