export declare const orderConfirmationTemplate: (data: {
    orderNumber: string;
    customerName: string;
    orderDate: string;
    items: Array<{
        name: string;
        quantity: number;
        price: number;
        total: number;
    }>;
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    shippingAddress: {
        name: string;
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    };
    trackingUrl?: string;
    contactEmail: string;
    contactPhone: string;
}) => string;
