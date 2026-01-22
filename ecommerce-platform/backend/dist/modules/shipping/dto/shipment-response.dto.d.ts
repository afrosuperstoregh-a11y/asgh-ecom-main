import { ShipmentStatus } from '../../../common/entities/shipment.entity';
export { ShipmentStatus } from '../../../common/entities/shipment.entity';
export declare class PackageItemResponseDto {
    description: string;
    quantity: number;
    weight: number;
    length: number;
    width: number;
    height: number;
    value?: number;
    sku?: string;
}
export declare class AddressResponseDto {
    name: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    phone?: string;
    email?: string;
}
export declare class TrackingEventDto {
    status: string;
    description: string;
    timestamp: string;
    location?: string;
    details?: Record<string, any>;
}
export declare class ShipmentResponseDto {
    id: string;
    orderId: string;
    carrier: string;
    serviceName: string;
    trackingNumber: string;
    trackingUrl?: string;
    labelUrl?: string;
    returnLabelUrl?: string;
    cost: number;
    status: ShipmentStatus;
    statusDescription?: string;
    serviceCode?: string;
    estimatedDeliveryDate?: string;
    sender: AddressResponseDto;
    recipient: AddressResponseDto;
    items: PackageItemResponseDto[];
    trackingEvents?: TrackingEventDto[];
    createdAt: string;
    updatedAt: string;
    metadata?: Record<string, any>;
}
export declare class CreateShipmentResponseDto {
    shipment: ShipmentResponseDto;
    message?: string;
}
export declare class TrackShipmentResponseDto {
    trackingNumber: string;
    carrier: string;
    status: ShipmentStatus;
    statusDescription: string;
    estimatedDeliveryDate?: string;
    actualDeliveryDate?: string;
    events: TrackingEventDto[];
    details?: Record<string, any>;
}
export declare class ShipmentStatusResponseDto {
    trackingNumber: string;
    carrier: string;
    status: ShipmentStatus;
    statusDescription: string;
    estimatedDeliveryDate?: string;
    lastUpdated?: string;
}
