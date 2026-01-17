// canada-post.service.ts
import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as xml2js from 'xml2js';
import { v4 as uuidv4 } from 'uuid';
import { RedisService } from '@/common/redis/redis.services';
import { 
  CanadaPostConfig, 
  CanadaPostCreateShipmentRequest,
  CanadaPostCreateShipmentResponse,
  CanadaPostTrackingResponse,
  CanadaPostRateResponse,
  CanadaPostErrorResponse
} from './canada-post.types';
import { 
  calculatePackageDimensions, 
  calculateTotalWeight,
  formatAddress,
  handleCanadaPostError,
  CanadaPostError
} from './canada-post.utils';
import { 
  CreateShipmentDto, 
  PackageType, 
  ShipmentPurpose,
  PackageItemDto 
} from '@/modules/shipping/dto/create-shipment.dto';
import { 
  ShipmentResponseDto, 
  TrackShipmentResponseDto,
  ShipmentStatus,
  PackageItemResponseDto
} from '@/modules/shipping/dto/shipment-response.dto';

@Injectable()
export class CanadaPostService implements OnModuleInit {
  private readonly logger = new Logger(CanadaPostService.name);
  private config: CanadaPostConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly redisService: RedisService,
  ) {}

  onModuleInit() {
    this.initializeConfig();
  }

  private initializeConfig() {
    const env = this.configService.get<'development' | 'production'>('CANADA_POST_ENV', 'development');
    const isProduction = env === 'production';
    
    this.config = {
      env,
      apiKey: isProduction 
        ? this.configService.get<string>('CANADA_POST_PROD_KEY', '')
        : this.configService.get<string>('CANADA_POST_DEV_KEY', ''),
      secret: isProduction
        ? this.configService.get<string>('CANADA_POST_PROD_SECRET', '')
        : this.configService.get<string>('CANADA_POST_DEV_SECRET', ''),
      customerNumber: this.configService.get<string>('CANADA_POST_CUSTOMER_NUMBER', ''),
      contractId: this.configService.get<string>('CANADA_POST_CONTRACT_ID', ''),
      baseUrl: isProduction
        ? 'https://soa-gw.canadapost.ca'
        : 'https://ct.soa-gw.canadapost.ca',
      endpoints: {
        rates: '/rs/ship/price',
        shipment: '/rs/shipment',
        tracking: '/vis/track/pin'
      }
    };

    if (!this.config.apiKey || !this.config.secret || !this.config.customerNumber) {
      this.logger.warn('Canada Post configuration is incomplete. Shipping features may not work correctly.');
    }
  }

  // ... existing methods ...

  /**
   * Create a new shipment with Canada Post
   */
  async createShipment(createShipmentDto: CreateShipmentDto): Promise<ShipmentResponseDto> {
    const { orderId, sender, recipient, items, serviceCode, requiresSignature, isInsured, insuredValue } = createShipmentDto;
    
    try {
      // Format addresses
      const formattedSender = formatAddress(sender);
      const formattedRecipient = formatAddress(recipient);
      
      // Calculate package dimensions and weight
      const packageDimensions = calculatePackageDimensions(items);
      const totalWeight = calculateTotalWeight(items);
      
      // Prepare the shipment request
      const shipmentRequest: CanadaPostCreateShipmentRequest = {
        customerNumber: this.config.customerNumber,
        contractId: this.config.contractId,
        expectedMailingDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        sender: formattedSender,
        destination: formattedRecipient,
        parcelCharacteristics: {
          weight: totalWeight,
          dimensions: packageDimensions,
        },
        preferences: {
          showPackingInstructions: true,
          showPostageRate: true,
          showInsuredValue: isInsured ?? false,
        },
        // Add additional options
        ...(requiresSignature && { options: { signatureRequired: true } }),
        ...(isInsured && insuredValue && { 
          options: { 
            coverage: true,
            coverageAmount: insuredValue,
            coverageCurrency: 'CAD'
          } 
        }),
      };

      // Make the API request to create the shipment
      const response = await this.makeRequest<CanadaPostCreateShipmentResponse>({
        method: 'POST',
        url: `${this.config.baseUrl}${this.config.endpoints.shipment}`,
        data: shipmentRequest,
      });

      // Map the response to our DTO
      const shipmentResponse: ShipmentResponseDto = {
        id: response.shipmentId,
        orderId: orderId.toString(),
        carrier: 'CANADA_POST',
        serviceName: response.serviceName,
        serviceCode: response.serviceCode,
        trackingNumber: response.trackingPin,
        trackingUrl: response.trackingUrl,
        labelUrl: response.labelUrl,
        returnLabelUrl: response.returnLabelUrl,
        cost: response.price.total,
        status: ShipmentStatus.CREATED,
        sender: formattedSender,
        recipient: formattedRecipient,
        items: items.map((item: PackageItemDto) => ({
          description: item.description,
          quantity: item.quantity,
          weight: item.weight,
          length: item.dimensions.length,
          width: item.dimensions.width,
          height: item.dimensions.height,
          value: item.value,
          sku: item.sku,
        })),
        estimatedDeliveryDate: response.expectedDeliveryDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return shipmentResponse;
    } catch (error) {
      throw handleCanadaPostError(error, this.logger, 'createShipment');
    }
  }

  /**
   * Track a shipment by tracking number
   */
  async trackShipment(trackingNumber: string): Promise<TrackShipmentResponseDto> {
    try {
      const response = await this.makeRequest<CanadaPostTrackingResponse>({
        method: 'GET',
        url: `${this.config.baseUrl}/vis/track/pin/${trackingNumber}/summary`,
      });

      // Map the response to our DTO
      const trackingResponse: TrackShipmentResponseDto = {
        trackingNumber: response.trackingPin,
        carrier: 'CANADA_POST',
        status: this.mapTrackingStatus(response.deliveryStatus.status),
        statusDescription: response.deliveryStatus.description,
        estimatedDeliveryDate: response.deliveryStatus.expectedDeliveryDate,
        actualDeliveryDate: response.deliveryStatus.actualDeliveryDate,
        events: response.events.map(event => ({
          status: event.eventType,
          description: event.eventDescription,
          timestamp: event.eventDateTime,
          location: event.location,
          details: event.details,
        })),
      };

      return trackingResponse;
    } catch (error) {
      throw handleCanadaPostError(error, this.logger, 'trackShipment');
    }
  }

  /**
   * Get shipping rates for a shipment
   */
  async getRates(rateRequest: any): Promise<any> {
    // Implementation for getting shipping rates
    // This should be similar to the existing getRates implementation
    // but with proper error handling and response mapping
  }

  /**
   * Make an authenticated request to the Canada Post API
   */
  private async makeRequest<T>(options: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    url: string;
    data?: any;
    params?: Record<string, any>;
    headers?: Record<string, string>;
  }): Promise<T> {
    const { method, url, data, params, headers = {} } = options;
    
    // Add authentication headers
    const authString = Buffer.from(`${this.config.apiKey}:${this.config.secret}`).toString('base64');
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Basic ${authString}`,
      'Accept-language': 'en-CA',
    };

    try {
      const response = await firstValueFrom(
        this.httpService.request<T>({
          method,
          url,
          data,
          params,
          headers: { ...defaultHeaders, ...headers },
        }),
      );

      return response.data;
    } catch (error) {
      throw handleCanadaPostError(error, this.logger, `${method} ${url}`);
    }
  }

  /**
   * Map Canada Post status to our internal status
   */
  private mapTrackingStatus(canadaPostStatus: string): ShipmentStatus {
    const statusMap: Record<string, ShipmentStatus> = {
      'in_transit': ShipmentStatus.IN_TRANSIT,
      'out_for_delivery': ShipmentStatus.OUT_FOR_DELIVERY,
      'delivered': ShipmentStatus.DELIVERED,
      'available_for_pickup': ShipmentStatus.AVAILABLE_FOR_PICKUP,
      'return_to_sender': ShipmentStatus.RETURNED,
      'exception': ShipmentStatus.EXCEPTION,
      'not_found': ShipmentStatus.NOT_FOUND,
    };

    return statusMap[canadaPostStatus.toLowerCase()] || ShipmentStatus.UNKNOWN;
  }
}