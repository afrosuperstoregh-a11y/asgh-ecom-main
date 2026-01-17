import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { CanadaPostService } from '../../../../src/modules/shipping/providers/canada-post/canada-post.service';
import { RedisService } from '../../../../src/common/redis/redis.service';
import { CreateShipmentDto, PackageType, ShipmentPurpose } from '../../../../src/modules/shipping/dto/create-shipment.dto';
import { ShipmentStatus } from '../../../../src/common/entities/shipment.entity';

describe('CanadaPostService', () => {
  let service: CanadaPostService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;
  let redisService: jest.Mocked<RedisService>;

  const mockConfig = {
    env: 'development',
    apiKey: 'test-api-key',
    secret: 'test-secret',
    customerNumber: '123456789',
    contractId: '1234567',
    baseUrl: 'https://ct.soa-gw.canadapost.ca',
  };

  const mockShipmentRequest: CreateShipmentDto = {
    orderId: 1001,
    packageType: PackageType.PARCEL,
    purpose: ShipmentPurpose.SOLD,
    sender: {
      name: 'Test Sender',
      company: 'Test Company',
      address1: '123 Test St',
      city: 'Vancouver',
      province: 'BC',
      postalCode: 'V6B 1A1',
      country: 'CA',
      phone: '123-456-7890',
      email: 'sender@test.com',
    },
    recipient: {
      name: 'Test Recipient',
      address1: '456 Oak Ave',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M5V 1K4',
      country: 'CA',
      phone: '987-654-3210',
      email: 'recipient@test.com',
    },
    items: [
      {
        description: 'Test Product',
        quantity: 1,
        weight: 0.5,
        dimensions: {
          length: 10,
          width: 10,
          height: 10,
          unit: 'cm',
        },
        value: 29.99,
      },
    ],
    serviceCode: 'DOM.EP',
    requiresSignature: false,
    isInsured: true,
    insuredValue: 29.99,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CanadaPostService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const configMap = {
                'CANADA_POST_ENV': 'development',
                'CANADA_POST_DEV_KEY': 'test-api-key',
                'CANADA_POST_DEV_SECRET': 'test-secret',
                'CANADA_POST_PROD_KEY': '',
                'CANADA_POST_PROD_SECRET': '',
                'CANADA_POST_CUSTOMER_NUMBER': '123456789',
                'CANADA_POST_CONTRACT_ID': '1234567',
              };
              return configMap[key] || defaultValue;
            }),
          },
        },
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
            get: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CanadaPostService>(CanadaPostService);
    httpService = module.get<HttpService>(HttpService) as jest.Mocked<HttpService>;
    configService = module.get<ConfigService>(ConfigService) as jest.Mocked<ConfigService>;
    redisService = module.get<RedisService>(RedisService) as jest.Mocked<RedisService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createShipment', () => {
    it('should create a shipment successfully', async () => {
      const mockResponse = {
        data: {
          'messages': [],
          'shipment-id': '123456789',
          'tracking-pin': '123456789012',
          'links': [
            {
              rel: 'self',
              href: 'https://ct.soa-gw.canadapost.ca/rs/123456789/123456789/shipment/123456789',
              media: 'application/vnd.cpc.shipment-v8+xml',
            },
            {
              rel: 'label',
              href: 'https://ct.soa-gw.canadapost.ca/rs/artifacts/123456789/987654321/label',
              media: 'application/pdf',
            },
          ],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      jest.spyOn(httpService, 'post').mockImplementation(() => of(mockResponse as any));

      const result = await service.createShipment(mockShipmentRequest);

      expect(result).toBeDefined();
      expect(result.trackingNumber).toBe('123456789012');
      expect(result.status).toBe(ShipmentStatus.CREATED);
      expect(httpService.post).toHaveBeenCalled();
    });

    it('should handle API errors when creating a shipment', async () => {
      const errorResponse = {
        response: {
          data: {
            'messages': [
              {
                'code': '5000',
                'description': 'Internal Server Error',
              },
            ],
          },
          status: 500,
          statusText: 'Internal Server Error',
          headers: {},
          config: {},
        },
      };

      jest.spyOn(httpService, 'post').mockImplementation(() => throwError(errorResponse));

      await expect(service.createShipment(mockShipmentRequest)).rejects.toThrow();
    });
  });

  describe('trackShipment', () => {
    it('should track a shipment successfully', async () => {
      const trackingNumber = '123456789012';
      const mockResponse = {
        data: {
          'tracking-pin-info': {
            'pin': trackingNumber,
            'mailed-by': '123456789',
            'mailed-on-behalf-of': null,
            'mailed-on': '2024-01-01',
            'original-pin': null,
            'service-name': 'Xpresspost',
            'service-name-2': null,
            'destination-postal-id': 'M5V1K4',
            'destination-province': 'ON',
            'service-areas': {
              'origin': 'VANCOUVER',
              'destination': 'TORONTO',
            },
            'expected-delivery-date': '2024-01-05',
            'actual-delivery-date': null,
            'event': [
              {
                'event-identifier': 'OT1',
                'event-date': '2024-01-01',
                'event-time': '13:00:00',
                'event-time-zone': 'PST',
                'event-description': 'Item processed',
                'event-site': 'VANCOUVER',
                'event-province': 'BC',
                'event-latitude': '49.2827',
                'event-longitude': '-123.1207',
                'retail-location-id': '12345',
                'retail-name': 'VANCOUVER RPO',
                'signatory-name': null,
              },
            ],
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      jest.spyOn(httpService, 'get').mockImplementation(() => of(mockResponse as any));

      const result = await service.trackShipment(trackingNumber);

      expect(result).toBeDefined();
      expect(result.trackingNumber).toBe(trackingNumber);
      expect(result.status).toBeDefined();
      expect(result.events).toBeDefined();
      expect(result.events.length).toBeGreaterThan(0);
      expect(httpService.get).toHaveBeenCalled();
    });
  });
});
