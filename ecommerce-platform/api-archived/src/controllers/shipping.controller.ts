import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { CanadaPostService } from '../services/canadaPost.service';
import { cacheService } from '../services/cache.service';
import { Shipment, ShipmentStatus } from '../models/Shipment';
import { 
  ShippingRateRequest, 
  CreateShipmentRequest, 
  CanadaPostError,
  ShippingRate,
  ShipmentResponse,
  TrackingResponse
} from '../types/canadaPost';
import { logger } from '../utils/logger';

/**
 * @swagger
 * tags:
 *   name: Shipping
 *   description: Shipping operations with Canada Post
 */

export class ShippingController {
  private canadaPostService: CanadaPostService;

  constructor() {
    this.canadaPostService = new CanadaPostService();
  }
  /**
   * @swagger
   * /api/shipping/canada-post/rates:
   *   post:
   *     summary: Get shipping rates from Canada Post
   *     tags: [Shipping]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ShippingRateRequest'
   *     responses:
   *       200:
   *         description: List of available shipping rates
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/ShippingRate'
   *       400:
   *         description: Invalid request parameters
   *       500:
   *         description: Error fetching shipping rates
   */
  public async getRates(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const rateRequest: ShippingRateRequest = req.body;
      
      // Check cache first
      const cacheKey = {
        originPostalCode: rateRequest.originPostalCode,
        destinationPostalCode: rateRequest.destination.postalCode,
        dimensions: {
          length: rateRequest.parcel.length,
          width: rateRequest.parcel.width,
          height: rateRequest.parcel.height,
          weight: rateRequest.parcel.weight
        }
      };

      const cachedRates = await cacheService.getShippingRates(cacheKey);
      if (cachedRates) {
        logger.info('Returning cached shipping rates');
        res.json(cachedRates);
        return;
      }

      // If not in cache, fetch from Canada Post
      const rates = await this.canadaPostService.getRates(rateRequest);
      
      // Cache the rates for 30 minutes
      await cacheService.cacheShippingRates(cacheKey, rates, 1800);
      
      res.json(rates);
    } catch (error) {
      logger.error('Error fetching shipping rates:', error);
      if (error instanceof CanadaPostError) {
        res.status(error.statusCode).json({
          error: error.message,
          code: error.code,
          helpUrl: error.helpUrl
        });
      } else {
        res.status(500).json({ error: 'Failed to fetch shipping rates' });
      }
    }
  }

  /**
   * @swagger
   * /api/shipping/canada-post/ship:
   *   post:
   *     summary: Create a new shipment with Canada Post
   *     tags: [Shipping]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateShipmentRequest'
   *     responses:
   *       201:
   *         description: Shipment created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ShipmentResponse'
   *       400:
   *         description: Invalid request parameters
   *       500:
   *         description: Error creating shipment
   */
  public async createShipment(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const shipmentRequest: CreateShipmentRequest = req.body;
      
      // Create shipment in Canada Post
      const shipment = await this.canadaPostService.createShipment(shipmentRequest);
      
      // Save to database
      const newShipment = await Shipment.query().insert({
        orderId: shipmentRequest.orderId,
        serviceName: shipmentRequest.shippingService,
        trackingNumber: shipment.trackingNumber,
        trackingUrl: shipment.trackingUrl,
        labelUrl: shipment.labelUrl,
        shippingCost: shipment.price,
        totalCost: shipment.price, // Adjust if there are additional fees
        dimensions: {
          length: shipmentRequest.parcel.length,
          width: shipmentRequest.parcel.width,
          height: shipmentRequest.parcel.height,
          weight: shipmentRequest.parcel.weight,
          unit: 'cm' // Assuming Canada Post uses cm and kg
        },
        originAddress: shipmentRequest.sender,
        destinationAddress: shipmentRequest.recipient,
        status: ShipmentStatus.CREATED
      });

      // Cache the shipment details
      await cacheService.cacheShipment(shipment.trackingNumber, newShipment);
      
      res.status(201).json({
        shipmentId: newShipment.id,
        trackingNumber: newShipment.trackingNumber,
        labelUrl: newShipment.labelUrl,
        price: newShipment.totalCost,
        trackingUrl: newShipment.trackingUrl
      });
    } catch (error) {
      logger.error('Error creating shipment:', error);
      if (error instanceof CanadaPostError) {
        res.status(error.statusCode).json({
          error: error.message,
          code: error.code,
          helpUrl: error.helpUrl
        });
      } else {
        res.status(500).json({ error: 'Failed to create shipment' });
      }
    }
  }

  /**
   * @swagger
   * /api/shipping/canada-post/track/{trackingNumber}:
   *   get:
   *     summary: Track a shipment by tracking number
   *     tags: [Shipping]
   *     parameters:
   *       - in: path
   *         name: trackingNumber
   *         required: true
   *         schema:
   *           type: string
   *         description: The tracking number to look up
   *     responses:
   *       200:
   *         description: Shipment tracking information
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/TrackingResponse'
   *       404:
   *         description: Shipment not found
   *       500:
   *         description: Error fetching tracking information
   */
  public async trackShipment(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { trackingNumber } = req.params;
      
      // Check cache first
      const cachedShipment = await cacheService.getShipment(trackingNumber);
      if (cachedShipment) {
        logger.info('Returning cached shipment data');
        res.json(cachedShipment);
        return;
      }
      
      // If not in cache, fetch from database
      let shipment = await Shipment.query()
        .findOne({ trackingNumber })
        .withGraphFetched('order');
      
      // In shipping.controller.ts, update the trackShipment method:

  if (!shipment) {
    // If not in our database, try to get from Canada Post
    const trackingInfo = await this.canadaPostService.trackPackage(trackingNumber);
    
    // Create a minimal shipment record if it doesn't exist
    shipment = await Shipment.query().insert({
      trackingNumber,
      carrier: 'CANADA_POST',
      serviceName: trackingInfo.service || 'Unknown',
      status: this.mapTrackingStatus(trackingInfo.status),
      trackingUrl: `https://www.canadapost.ca/track-reperage/en#/details/${trackingNumber}`,
      // Use null for required fields that we don't have
      orderId: null, // Allow null for tracking-only shipments
      shippingCost: 0,
      totalCost: 0,
      dimensions: { length: 0, width: 0, height: 0, weight: 0, unit: 'cm' },
      originAddress: {},
      destinationAddress: {}
    } as any); // Temporary type assertion to avoid type errors
  }
      // Cache the shipment details
      await cacheService.cacheShipment(trackingNumber, shipment);
      
      res.json({
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        service: shipment.serviceName,
        delivered: shipment.status === ShipmentStatus.DELIVERED,
        deliveryDate: shipment.deliveredAt || null,
        estimatedDeliveryDate: null, // Canada Post might provide this
        events: [] // Would be populated from tracking API
      });
    } catch (error) {
      logger.error('Error tracking shipment:', error);
      if (error instanceof CanadaPostError) {
        res.status(error.statusCode).json({
          error: error.message,
          code: error.code,
          helpUrl: error.helpUrl
        });
      } else {
        res.status(500).json({ error: 'Failed to track shipment' });
      }
    }
  }

  /**
   * Map Canada Post tracking status to our internal status
   */
  private mapTrackingStatus(canadaPostStatus: string): ShipmentStatus {
    const statusMap: Record<string, ShipmentStatus> = {
      'in_transit': ShipmentStatus.IN_TRANSIT,
      'out_for_delivery': ShipmentStatus.OUT_FOR_DELIVERY,
      'delivered': ShipmentStatus.DELIVERED,
      'available_for_pickup': ShipmentStatus.IN_TRANSIT,
      'in_transit_delayed': ShipmentStatus.IN_TRANSIT,
      'error': ShipmentStatus.FAILED
    };

    return statusMap[canadaPostStatus.toLowerCase()] || ShipmentStatus.PROCESSING;
  }

  private handleError(error: unknown, res: Response) {
    logger.error('Shipping Error:', error);

    if (error instanceof CanadaPostError) {
      return res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message,
          helpUrl: error.helpUrl,
        },
      });
    }

    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
}

export const shippingController = new ShippingController();
