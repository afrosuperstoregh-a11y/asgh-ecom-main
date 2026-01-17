import { Repository } from 'typeorm';
import { Shipment } from '../../common/entities/shipment.entity';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { ShipmentResponseDto } from './dto/shipment-response.dto';
import { CanadaPostService } from './providers/canada-post/canada-post.service';
import { ShippingRateRequestDto } from './dto/shipping-rate-request.dto';
import { ShippingRatesResponseDto } from './dto/shipping-rate-response.dto';
export declare class ShippingService {
    private readonly shipmentRepository;
    private readonly canadaPostService;
    constructor(shipmentRepository: Repository<Shipment>, canadaPostService: CanadaPostService);
    create(createShipmentDto: CreateShipmentDto): Promise<ShipmentResponseDto>;
    findAll(): Promise<ShipmentResponseDto[]>;
    findOne(id: number): Promise<ShipmentResponseDto>;
    update(id: number, updateShipmentDto: Partial<CreateShipmentDto>): Promise<ShipmentResponseDto>;
    remove(id: number): Promise<void>;
    getRates(rateRequest: ShippingRateRequestDto): Promise<ShippingRatesResponseDto>;
    buyLabel(shipmentId: number): Promise<{
        labelUrl: string;
        trackingNumber: string;
    }>;
    private mapToDto;
}
