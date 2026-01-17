export declare enum ShipmentStatus {
    CREATED = "CREATED",
    PROCESSING = "PROCESSING",
    SHIPPED = "SHIPPED",
    IN_TRANSIT = "IN_TRANSIT",
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
    DELIVERED = "DELIVERED",
    FAILED = "FAILED",
    RETURNED = "RETURNED",
    CANCELLED = "CANCELLED"
}
export declare class Shipment {
    id: number;
    orderId: number;
    carrier: string;
    serviceName: string;
    trackingNumber: string;
    labelUrl: string;
    cost: number;
    status: ShipmentStatus;
    createdAt: Date;
    updatedAt: Date;
    shipmentId?: string;
    returnShipmentId?: string;
    returnLabelUrl?: string;
    metadata?: Record<string, any>;
    updateStatus(newStatus: ShipmentStatus): void;
    isShipped(): boolean;
    isDelivered(): boolean;
}
