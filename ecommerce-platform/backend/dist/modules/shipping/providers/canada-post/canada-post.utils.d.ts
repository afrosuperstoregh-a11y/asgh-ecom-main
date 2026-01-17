import { Logger } from '@nestjs/common';
export declare class CanadaPostError extends Error {
    readonly code: number;
    readonly details?: any | undefined;
    constructor(code: number, details?: any | undefined, message?: string);
}
export declare function handleCanadaPostError(error: any, logger: Logger, context?: string): never;
export declare function calculatePackageDimensions(items: Array<{
    dimensions: {
        length: number;
        width: number;
        height: number;
    };
}>): {
    length: number;
    width: number;
    height: number;
};
export declare function calculateTotalWeight(items: Array<{
    weight: number;
}>): number;
export declare function formatAddress(address: {
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
}): {
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
};
