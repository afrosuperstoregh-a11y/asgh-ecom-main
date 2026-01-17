import { ShippingService } from '../shipping.service';
import { CreateShipmentDto } from '../dto/create-shipment.dto';
import { ShipmentResponseDto } from '../dto/shipment-response.dto';
import { ShippingRateRequestDto } from '../dto/shipping-rate-request.dto';
export declare class ShippingController {
    private readonly shippingService;
    constructor(shippingService: ShippingService);
    create(createShipmentDto: CreateShipmentDto): Promise<ShipmentResponseDto>;
    findAll(): Promise<ShipmentResponseDto[]>;
    findOne(id: number): Promise<ShipmentResponseDto>;
    update(id: number, updateShipmentDto: Partial<CreateShipmentDto>): Promise<ShipmentResponseDto>;
    remove(id: number): Promise<void>;
    getRates(id: number, rateRequest: ShippingRateRequestDto): Promise<any>;
    buyLabel(id: number): Promise<any>;
}
