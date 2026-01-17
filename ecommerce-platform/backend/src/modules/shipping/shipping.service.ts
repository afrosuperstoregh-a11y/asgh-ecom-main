// File: ecommerce-platform/backend/src/modules/shipping/shipping.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment, ShipmentStatus } from '../../common/entities/shipment.entity';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { ShipmentResponseDto } from './dto/shipment-response.dto';
import { CanadaPostService } from './providers/canada-post/canada-post.service';
import { ShippingRateRequestDto } from './dto/shipping-rate-request.dto';
import { ShippingRatesResponseDto } from './dto/shipping-rate-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ShippingService {
  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentRepository: Repository<Shipment>,
    private readonly canadaPostService: CanadaPostService,
  ) {}

  async create(createShipmentDto: CreateShipmentDto): Promise<ShipmentResponseDto> {
    // For now, we'll create a basic shipment with minimal required fields
    // In a real implementation, you would process the DTO and create a proper shipment
    const shipment = this.shipmentRepository.create({
      orderId: createShipmentDto.orderId,
      carrier: 'CANADA_POST', // Default carrier
      serviceName: 'Regular', // Default service
      trackingNumber: `CP${Date.now()}`,
      cost: 0, // Will be updated when rates are calculated
      status: ShipmentStatus.CREATED,
    });
    
    const savedShipment = await this.shipmentRepository.save(shipment);
    return this.mapToDto(savedShipment);
  }

  async findAll(): Promise<ShipmentResponseDto[]> {
    const shipments = await this.shipmentRepository.find();
    return shipments.map(shipment => this.mapToDto(shipment));
  }

  async findOne(id: number): Promise<ShipmentResponseDto> {
    const shipment = await this.shipmentRepository.findOne({ where: { id } });
    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${id} not found`);
    }
    return this.mapToDto(shipment);
  }

  async update(
    id: number,
    updateShipmentDto: Partial<CreateShipmentDto>,
  ): Promise<ShipmentResponseDto> {
    const shipment = await this.shipmentRepository.preload({
      id,
      ...updateShipmentDto,
    });
    
    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${id} not found`);
    }
    
    const updatedShipment = await this.shipmentRepository.save(shipment);
    return this.mapToDto(updatedShipment);
  }

  async remove(id: number): Promise<void> {
    const result = await this.shipmentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Shipment with ID ${id} not found`);
    }
  }

  async getRates(rateRequest: ShippingRateRequestDto): Promise<ShippingRatesResponseDto> {
    // In the future, we can add logic here to support multiple carriers
    return this.canadaPostService.getRates(rateRequest);
  }

  async buyLabel(shipmentId: number): Promise<{ labelUrl: string; trackingNumber: string }> {
    const shipment = await this.shipmentRepository.findOne({ where: { id: shipmentId } });
    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
    }

    // In a real implementation, this would call the shipping provider's API to purchase a label
    // For now, we'll simulate a successful label purchase
    const labelUrl = `https://api.shipping-provider.com/labels/${shipmentId}`;
    const trackingNumber = `CP${Date.now()}`;
    
    // Update the shipment with the tracking information
    await this.shipmentRepository.update(shipmentId, {
      status: ShipmentStatus.PROCESSING,
      trackingNumber,
      labelUrl,
    });

    return { labelUrl, trackingNumber };
  }

  private mapToDto(shipment: Shipment): ShipmentResponseDto {
    // Map the entity to the response DTO
    // Note: Some fields in the DTO are required but not in the entity
    // This is a simplified mapping - in a real app, you'd need to handle all required fields
    return plainToInstance(ShipmentResponseDto, {
      id: shipment.id.toString(),
      orderId: shipment.orderId.toString(),
      carrier: shipment.carrier,
      serviceName: shipment.serviceName,
      trackingNumber: shipment.trackingNumber,
      labelUrl: shipment.labelUrl,
      cost: shipment.cost,
      status: shipment.status,
      // These would come from related data in a real implementation
      sender: {},
      recipient: {},
      items: [],
      createdAt: shipment.createdAt?.toISOString(),
      updatedAt: shipment.updatedAt?.toISOString(),
    });
  }
}