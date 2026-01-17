export declare class ShippingDimensionsDto {
    length: number;
    width: number;
    height: number;
}
export declare class ShippingRateRequestDto {
    originPostalCode: string;
    destinationPostalCode: string;
    weight: number;
    dimensions: ShippingDimensionsDto;
    quoteType?: 'commercial' | 'counter';
}
