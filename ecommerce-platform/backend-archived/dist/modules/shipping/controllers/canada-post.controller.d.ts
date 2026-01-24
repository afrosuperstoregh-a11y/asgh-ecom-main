import { CanadaPostService } from '../providers/canada-post/canada-post.service';
import { ShippingRateRequestDto } from '../dto/shipping-rate-request.dto';
import { ShippingRatesResponseDto } from '../dto/shipping-rate-response.dto';
export declare class CanadaPostController {
    private readonly canadaPostService;
    constructor(canadaPostService: CanadaPostService);
    getRates(rateRequest: ShippingRateRequestDto): Promise<ShippingRatesResponseDto>;
    createShipment(): Promise<void>;
    trackShipment(trackingNumber: string): Promise<import("../dto/shipment-response.dto").TrackShipmentResponseDto>;
}
