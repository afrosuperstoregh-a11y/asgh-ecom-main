// shipping-rate-request.dto.ts
import { IsArray, IsNotEmpty, IsString, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AddressDto {
  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  province: string;
}

class ItemDto {
  @IsNumber()
  @IsNotEmpty()
  weight: number;

  @IsNumber()
  @IsNotEmpty()
  length: number;

  @IsNumber()
  @IsNotEmpty()
  width: number;

  @IsNumber()
  @IsNotEmpty()
  height: number;
}

export class ShippingRateRequestDto {
  @ValidateNested()
  @Type(() => AddressDto)
  @IsNotEmpty()
  origin: AddressDto;

  @ValidateNested()
  @Type(() => AddressDto)
  @IsNotEmpty()
  destination: AddressDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items: ItemDto[];
}

// shipping-rate-response.dto.ts
export class ShippingRateDto {
  serviceName: string;
  serviceCode: string;
  totalPrice: number;
  currency: string;
  estimatedDeliveryDate?: string;
}

export class ShippingRatesResponseDto {
  rates: ShippingRateDto[];
}