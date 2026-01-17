import { ShippingDimensionsDto } from './shipping-rate-request.dto';
export declare enum PackageType {
    PARCEL = "parcel",
    DOCUMENT = "document",
    FREIGHT = "freight"
}
export declare enum ShipmentPurpose {
    GIFT = "GIFT",
    SOLD = "SOLD",
    RETURN = "RETURN",
    REPAIR = "REPAIR",
    PERSONAL = "PERSONAL",
    NOT_SOLD = "NOT_SOLD",
    OTHER = "OTHER"
}
export declare class PackageItemDto {
    description: string;
    quantity: number;
    weight: number;
    dimensions: ShippingDimensionsDto;
    value?: number;
    sku?: string;
    hsCode?: string;
    originCountry?: string;
}
export declare class AddressDto {
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
export declare class CreateShipmentDto {
    orderId: number;
    packageType?: PackageType;
    purpose?: ShipmentPurpose;
    sender: AddressDto;
    recipient: AddressDto;
    items: PackageItemDto[];
    serviceCode?: string;
    requiresSignature?: boolean;
    isInsured?: boolean;
    insuredValue?: number;
    instructions?: string;
    metadata?: Record<string, any>;
}
