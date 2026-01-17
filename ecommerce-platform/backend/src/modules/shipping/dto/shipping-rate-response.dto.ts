import { ApiProperty } from '@nestjs/swagger';

export class ShippingRateDto {
  @ApiProperty({
    description: 'Name of the shipping service',
    example: 'Expedited Parcel',
  })
  serviceName: string;

  @ApiProperty({
    description: 'Unique code for the shipping service',
    example: 'DOM.EP',
  })
  serviceCode: string;

  @ApiProperty({
    description: 'Price of the shipping service in CAD',
    example: 12.99,
  })
  price: number;

  @ApiProperty({
    description: 'Estimated delivery date in ISO format',
    example: '2023-06-15',
  })
  deliveryDate: string;

  @ApiProperty({
    description: 'Estimated number of business days for delivery',
    example: 3,
  })
  deliveryDays: number;

  @ApiProperty({
    description: 'Indicates if this is the fastest available option',
    example: false,
    required: false,
  })
  isFastest?: boolean;

  @ApiProperty({
    description: 'Indicates if this is the most economical option',
    example: true,
    required: false,
  })
  isCheapest?: boolean;
}

export class ShippingRatesResponseDto {
  @ApiProperty({
    description: 'Array of available shipping rates',
    type: [ShippingRateDto],
  })
  rates: ShippingRateDto[];

  @ApiProperty({
    description: 'Origin postal code',
    example: 'M5V3L9',
  })
  originPostalCode: string;

  @ApiProperty({
    description: 'Destination postal code',
    example: 'V6B2W9',
  })
  destinationPostalCode: string;
}
