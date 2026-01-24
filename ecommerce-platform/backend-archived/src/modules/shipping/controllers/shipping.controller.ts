// shipping.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Put, 
  Delete, 
  ParseIntPipe, 
  HttpStatus,
  HttpCode 
} from '@nestjs/common';
import { ShippingService } from '../shipping.service';
import { CreateShipmentDto } from '../dto/create-shipment.dto';
import { ShipmentResponseDto } from '../dto/shipment-response.dto';
import { ShippingRateRequestDto } from '../dto/shipping-rate-request.dto';
import { ShippingRatesResponseDto } from '../dto/shipping-rate-response.dto';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post('shipments')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createShipmentDto: CreateShipmentDto): Promise<ShipmentResponseDto> {
    return this.shippingService.create(createShipmentDto);
  }

  @Get('shipments')
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<ShipmentResponseDto[]> {
    return this.shippingService.findAll();
  }

  @Get('shipments/:id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ShipmentResponseDto> {
    return this.shippingService.findOne(id);
  }

  @Put('shipments/:id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateShipmentDto: Partial<CreateShipmentDto>,
  ): Promise<ShipmentResponseDto> {
    return this.shippingService.update(id, updateShipmentDto);
  }

  @Delete('shipments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.shippingService.remove(id);
  }

  @Post('shipments/:id/rates')
  @HttpCode(HttpStatus.OK)
  async getRates(
    @Param('id', ParseIntPipe) id: number,
    @Body() rateRequest: ShippingRateRequestDto,
  ): Promise<ShippingRatesResponseDto> {
    return this.shippingService.getRates(rateRequest);
  }

  @Post('shipments/:id/buy')
  @HttpCode(HttpStatus.OK)
  async buyLabel(
    @Param('id', ParseIntPipe) id: number
  ): Promise<{ labelUrl: string; trackingNumber: string }> {
    return this.shippingService.buyLabel(id);
  }
}