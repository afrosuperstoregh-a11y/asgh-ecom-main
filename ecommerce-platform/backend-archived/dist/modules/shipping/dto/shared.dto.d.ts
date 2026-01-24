export declare class ShippingDimensionsDto {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
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
