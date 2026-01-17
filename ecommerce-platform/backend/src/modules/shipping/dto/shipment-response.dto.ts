import { 
  IsString, 
  IsNumber, 
  IsDateString, 
  IsOptional, 
  IsArray, 
  IsBoolean, 
  IsObject,
  IsEnum,
  ValidateNested 
} from 'class-validator';
import { Type } from 'class-transformer';
import { ShipmentStatus } from '../../../common/entities/shipment.entity';

export { ShipmentStatus } from '../../../common/entities/shipment.entity';

export class PackageItemResponseDto {
  @IsString()
  description: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  weight: number; // in kg

  @IsNumber()
  length: number; // in cm

  @IsNumber()
  width: number;  // in cm

  @IsNumber()
  height: number; // in cm

  @IsNumber()
  @IsOptional()
  value?: number; // in CAD

  @IsString()
  @IsOptional()
  sku?: string;
}

export class AddressResponseDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  address1: string;

  @IsString()
  @IsOptional()
  address2?: string;

  @IsString()
  city: string;

  @IsString()
  province: string;

  @IsString()
  postalCode: string;

  @IsString()
  country: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;
}

export class TrackingEventDto {
  @IsString()
  status: string;

  @IsString()
  description: string;

  @IsDateString()
  timestamp: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsObject()
  @IsOptional()
  details?: Record<string, any>;
}

export class ShipmentResponseDto {
  @IsString()
  id: string;

  @IsString()
  orderId: string;

  @IsString()
  carrier: string;

  @IsString()
  serviceName: string;

  @IsString()
  trackingNumber: string;

  @IsString()
  @IsOptional()
  trackingUrl?: string;

  @IsString()
  @IsOptional()
  labelUrl?: string;

  @IsString()
  @IsOptional()
  returnLabelUrl?: string;

  @IsNumber()
  cost: number;

  @IsEnum(ShipmentStatus)
  status: ShipmentStatus;

  @IsString()
  @IsOptional() 
  statusDescription?: string;

  @IsString()
  @IsOptional()
  serviceCode?: string;

  @IsDateString()
  @IsOptional()
  estimatedDeliveryDate?: string;

  @ValidateNested()
  @Type(() => AddressResponseDto)
  sender: AddressResponseDto;

  @ValidateNested()
  @Type(() => AddressResponseDto)
  recipient: AddressResponseDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageItemResponseDto)
  items: PackageItemResponseDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrackingEventDto)
  @IsOptional()
  trackingEvents?: TrackingEventDto[];

  @IsDateString()
  createdAt: string;

  @IsDateString()
  updatedAt: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class CreateShipmentResponseDto {
  @ValidateNested()
  @Type(() => ShipmentResponseDto)
  shipment: ShipmentResponseDto;

  @IsString()
  @IsOptional()
  message?: string;
}

export class TrackShipmentResponseDto {
  @IsString()
  trackingNumber: string;

  @IsString()
  carrier: string;

  @IsEnum(ShipmentStatus)
  status: ShipmentStatus;

  @IsString()
  statusDescription: string;

  @IsDateString()
  @IsOptional()
  estimatedDeliveryDate?: string;

  @IsDateString()
  @IsOptional()
  actualDeliveryDate?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrackingEventDto)
  events: TrackingEventDto[];

  @IsObject()
  @IsOptional()
  details?: Record<string, any>;
}

export class ShipmentStatusResponseDto {
  @IsString()
  trackingNumber: string;

  @IsString()
  carrier: string;

  @IsEnum(ShipmentStatus)
  status: ShipmentStatus;

  @IsString()
  statusDescription: string;

  @IsDateString()
  @IsOptional()
  estimatedDeliveryDate?: string;

  @IsDateString()
  @IsOptional()
  lastUpdated?: string;
}
