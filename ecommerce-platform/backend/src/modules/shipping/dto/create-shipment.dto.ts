import { 
  IsString, 
  IsNumber, 
  IsNotEmpty, 
  IsOptional, 
  IsEnum, 
  ValidateNested, 
  IsBoolean,
  IsArray,
  ArrayMinSize,
  IsObject
} from 'class-validator';
import { Type } from 'class-transformer';
import { ShippingDimensionsDto, AddressDto } from './shared.dto';

export enum PackageType {
  PARCEL = 'parcel',
  DOCUMENT = 'document',
  FREIGHT = 'freight',
}

export enum ShipmentPurpose {
  GIFT = 'GIFT',
  SOLD = 'SOLD',
  RETURN = 'RETURN',
  REPAIR = 'REPAIR',
  PERSONAL = 'PERSONAL',
  NOT_SOLD = 'NOT_SOLD',
  OTHER = 'OTHER',
}

export class PackageItemDto {
  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsNumber()
  @IsNotEmpty()
  quantity!: number;

  @IsNumber()
  @IsNotEmpty()
  weight!: number; // in kg

  @ValidateNested()
  @Type(() => ShippingDimensionsDto)
  dimensions!: ShippingDimensionsDto;

  @IsNumber()
  @IsOptional()
  value?: number; // in CAD

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  hsCode?: string;

  @IsString()
  @IsOptional()
  originCountry?: string;
}

export class CreateShipmentDto {
  @IsNumber()
  @IsNotEmpty()
  orderId!: number;

  @IsString()
  @IsOptional()
  @IsEnum(PackageType)
  packageType?: PackageType = PackageType.PARCEL;

  @IsString()
  @IsOptional()
  @IsEnum(ShipmentPurpose)
  purpose?: ShipmentPurpose = ShipmentPurpose.SOLD;

  @ValidateNested()
  @Type(() => AddressDto)
  sender!: AddressDto;

  @ValidateNested()
  @Type(() => AddressDto)
  recipient!: AddressDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PackageItemDto)
  items!: PackageItemDto[];

  @IsString()
  @IsOptional()
  serviceCode?: string;

  @IsBoolean()
  @IsOptional()
  requiresSignature?: boolean = false;

  @IsBoolean()
  @IsOptional()
  isInsured?: boolean = false;

  @IsNumber()
  @IsOptional()
  insuredValue?: number;

  @IsString()
  @IsOptional()
  instructions?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}