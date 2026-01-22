declare class AddressDto {
    country: string;
    postalCode: string;
    city: string;
    province: string;
}
declare class ItemDto {
    weight: number;
    length: number;
    width: number;
    height: number;
}
export declare class ShippingRateRequestDto {
    origin: AddressDto;
    destination: AddressDto;
    items: ItemDto[];
}
export declare class ShippingRateDto {
    serviceName: string;
    serviceCode: string;
    totalPrice: number;
    currency: string;
    estimatedDeliveryDate?: string;
}
export declare class ShippingRatesResponseDto {
    rates: ShippingRateDto[];
}
export {};
