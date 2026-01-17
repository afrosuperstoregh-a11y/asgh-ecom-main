export interface CanadaPostConfig {
  env: 'development' | 'production';
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  customerNumber?: string;
  contractNumber?: string;
}

export interface ShippingAddress {
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

export interface ParcelDimensions {
  length: number; // in cm
  width: number;  // in cm
  height: number; // in cm
  weight: number; // in kg
}

export interface ShippingRateRequest {
  originPostalCode: string;
  destination: ShippingAddress;
  parcel: ParcelDimensions;
  options?: {
    insuranceValue?: number;
    signatureRequired?: boolean;
    codAmount?: number;
  };
}

export interface ShippingRate {
  serviceCode: string;
  serviceName: string;
  price: number;
  deliveryDate: string;
  deliveryDayOfWeek: string;
  deliveryTime?: string;
  guaranteedDelivery?: boolean;
}

export interface CreateShipmentRequest {
  orderId: string;
  sender: ShippingAddress;
  recipient: ShippingAddress;
  parcel: ParcelDimensions;
  reference?: string;
  description?: string;
  shippingService: string;
  options?: {
    insuranceValue?: number;
    signatureRequired?: boolean;
    codAmount?: number;
  };
}

export interface ShipmentResponse {
  shipmentId: string;
  trackingNumber: string;
  labelUrl: string;
  price: number;
  trackingUrl: string;
}

export interface TrackingEvent {
  date: string;
  time: string;
  location: string;
  description: string;
  signatory?: string;
}

export interface TrackingResponse {
  trackingNumber: string;
  status: string;
  service: string;
  delivered: boolean;
  deliveryDate?: string;
  estimatedDeliveryDate?: string;
  events: TrackingEvent[];
}

export class CanadaPostError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public helpUrl?: string
  ) {
    super(message);
    this.name = 'CanadaPostError';
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CanadaPostError);
    }
  }
}
