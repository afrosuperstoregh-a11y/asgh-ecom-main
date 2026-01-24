export declare class ShippingRateDto {
    serviceName: string;
    serviceCode: string;
    price: number;
    deliveryDate: string;
    deliveryDays: number;
    isFastest?: boolean;
    isCheapest?: boolean;
}
export declare class ShippingRatesResponseDto {
    rates: ShippingRateDto[];
    originPostalCode: string;
    destinationPostalCode: string;
}
