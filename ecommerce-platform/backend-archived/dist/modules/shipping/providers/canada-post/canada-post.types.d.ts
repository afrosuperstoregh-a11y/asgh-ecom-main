export interface CanadaPostConfig {
    apiKey: string;
    customerNumber: string;
    contractId: string;
    env: 'development' | 'production';
    baseUrl: string;
    secret?: string;
    endpoints: {
        rates: string;
        shipment: string;
        tracking: string;
    };
}
export interface CanadaPostAddress {
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
export interface CanadaPostPackage {
    weight: number;
    dimensions: {
        length: number;
        width: number;
        height: number;
    };
    description: string;
    value?: number;
    sku?: string;
    hsCode?: string;
    originCountry?: string;
}
export interface CanadaPostCreateShipmentRequest {
    customerNumber: string;
    contractId?: string;
    expectedMailingDate: string;
    sender: CanadaPostAddress;
    destination: CanadaPostAddress;
    parcelCharacteristics: {
        weight: number;
        dimensions: {
            length: number;
            width: number;
            height: number;
        };
        unpackaged?: boolean;
        mailingTube?: boolean;
        oversized?: boolean;
    };
    notification?: {
        email: string;
        onShipment: boolean;
        onException: boolean;
        onDelivery: boolean;
    };
    preferences?: {
        showPackingInstructions: boolean;
        showPostageRate: boolean;
        showInsuredValue: boolean;
    };
    references?: {
        customerRef1?: string;
        customerRef2?: string;
    };
    customs?: {
        currency: string;
        conversionFromCad?: number;
        reasonForExport: string;
        otherReason?: string;
        dutiesAndTaxesPrepaid: boolean;
        certificateNumber?: string;
        licenceNumber?: string;
        invoiceNumber?: string;
        skuList: Array<{
            sku: string;
            hsCode?: string;
            originCountry: string;
            quantity: number;
            description: string;
            unitWeight: number;
            unitValue: number;
        }>;
    };
    settlementInfo?: {
        contractId: string;
        intendedMethodOfPayment?: 'Account' | 'CreditCard' | 'Cheque' | 'MoneyOrder' | 'Credit';
        promoCode?: string;
    };
}
export interface CanadaPostCreateShipmentResponse {
    shipmentId: string;
    trackingPin: string;
    trackingUrl: string;
    labelUrl: string;
    returnLabelUrl?: string;
    serviceName: string;
    serviceCode: string;
    price: {
        base: number;
        taxes: number;
        total: number;
        currency: string;
    };
    expectedDeliveryDate: string;
    expectedTransmitTime: string;
    expectedDeliveryTime: string;
    warnings?: string[];
}
export interface CanadaPostTrackingEvent {
    eventDateTime: string;
    eventType: string;
    eventDescription: string;
    location: string;
    signatoryName?: string;
    clientIp?: string;
    deviceId?: string;
    deviceType?: string;
    details?: Record<string, any>;
}
export interface CanadaPostTrackingResponse {
    trackingPin: string;
    mpid?: string;
    mta?: string;
    signatureImageExists: boolean;
    signatureImageUrl?: string;
    deliveryOptions: {
        itemAvailableForPickup: boolean;
        itemDelivered: boolean;
    };
    activeExists: boolean;
    archived: boolean;
    deliveryStatus: {
        status: string;
        description: string;
        lastUpdated: string;
        expectedDeliveryDate?: string;
        actualDeliveryDate?: string;
    };
    events: CanadaPostTrackingEvent[];
    serviceInfo?: {
        serviceName: string;
        serviceCode: string;
    };
    sender: {
        name: string;
        address: Omit<CanadaPostAddress, 'name'>;
    };
    destination: {
        name: string;
        address: Omit<CanadaPostAddress, 'name'>;
    };
    references?: {
        customerRef1?: string;
        customerRef2?: string;
    };
    packageDetails?: {
        weight: number;
        dimensions?: {
            length: number;
            width: number;
            height: number;
        };
    };
    paymentInfo?: {
        paymentType: 'Account' | 'CreditCard' | 'Cheque' | 'MoneyOrder' | 'Credit';
        paidAmount: number;
        currency: string;
    };
    customsInfo?: {
        currency: string;
        conversionFromCad?: number;
        reasonForExport: string;
        otherReason?: string;
        dutiesAndTaxesPrepaid: boolean;
        certificateNumber?: string;
        licenceNumber?: string;
        invoiceNumber?: string;
    };
    notification?: {
        email: string;
        onShipment: boolean;
        onException: boolean;
        onDelivery: boolean;
    };
    preferences?: {
        showPackingInstructions: boolean;
        showPostageRate: boolean;
        showInsuredValue: boolean;
    };
    createdBy?: {
        userId?: string;
        clientIp?: string;
        deviceId?: string;
        deviceType?: string;
    };
    createdAt: string;
    updatedAt: string;
}
export interface CanadaPostErrorResponse {
    code: number;
    message: string;
    description?: string;
    details?: Array<{
        field: string;
        message: string;
    }>;
}
export interface CanadaPostRateResponse {
    serviceName: string;
    serviceCode: string;
    price: {
        base: number;
        taxes: number;
        total: number;
        currency: string;
    };
    deliveryDate: string;
    deliveryDayOfWeek: string;
    deliveryTime: string;
    nextDayCutoff: string;
    transitTime: number;
    deliveryRange: {
        minDays: number;
        maxDays: number;
    };
    serviceStandard?: {
        expectedTransmitTime: string;
        expectedDeliveryTime: string;
    };
    guarantees?: {
        deliveryGuarantee: boolean;
        moneyBackGuarantee: boolean;
        exchangeRateGuarantee: boolean;
    };
    options?: {
        signatureRequired: boolean;
        collectOnDelivery: boolean;
        collectOnDeliveryAmount?: number;
        collectOnDeliveryCurrency?: string;
        coverage: boolean;
        coverageAmount?: number;
        coverageCurrency?: string;
        returnReceipt: boolean;
        returnReceiptEmail?: string;
        proofOfAgeRequired: boolean;
        proofOfAgeType?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J';
        safeDrop: boolean;
        soSignatureNotRequired: boolean;
        leaveAtDoor: boolean;
        leaveAtDoorInstruction?: string;
    };
    warnings?: string[];
}
