// UPI Payment utility functions

/**
 * Generate UPI deep link for payment
 * @param params Payment parameters
 * @returns UPI deep link URL
 */
export const generateUPILink = (params: {
    upiId: string;
    name: string;
    amount: number;
    transactionNote: string;
    transactionRef?: string;
}) => {
    const { upiId, name, amount, transactionNote, transactionRef } = params;

    // Construct UPI link manually to ensure maximum compatibility and no encoding of @ symbol
    let upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount.toString()}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;

    if (transactionRef) {
        upiUrl += `&tr=${encodeURIComponent(transactionRef)}`;
    }

    return upiUrl;
};

/**
 * Open UPI payment app
 * @param upiLink UPI deep link
 */
export const openUPIPayment = (upiLink: string) => {
    // Try to open UPI link
    window.location.href = upiLink;
};

/**
 * Generate UPI payment link for order
 * @param orderNumber Order number
 * @param amount Total amount
 * @param businessUpiId Business UPI ID
 * @param businessName Business name
 * @returns UPI payment link
 */
export const generateOrderUPILink = (
    orderNumber: string,
    amount: number,
    businessUpiId: string = 'balasundarimurugesan@ybl',
    businessName: string = 'BALASUNDARI M'
) => {
    return generateUPILink({
        upiId: businessUpiId,
        name: businessName,
        amount: amount,
        transactionNote: `Order ${orderNumber}`,
        transactionRef: orderNumber,
    });
};
