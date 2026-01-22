"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shippingController = exports.ShippingController = void 0;
const express_validator_1 = require("express-validator");
const canadaPost_service_1 = require("../services/canadaPost.service");
const cache_service_1 = require("../services/cache.service");
const Shipment_1 = require("../models/Shipment");
const canadaPost_1 = require("../types/canadaPost");
const logger_1 = require("../utils/logger");
/**
 * @swagger
 * tags:
 *   name: Shipping
 *   description: Shipping operations with Canada Post
 */
class ShippingController {
    constructor() {
        this.canadaPostService = new canadaPost_service_1.CanadaPostService();
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
    async getRates(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const rateRequest = req.body;
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
            const cachedRates = await cache_service_1.cacheService.getShippingRates(cacheKey);
            if (cachedRates) {
                logger_1.logger.info('Returning cached shipping rates');
                res.json(cachedRates);
                return;
            }
            // If not in cache, fetch from Canada Post
            const rates = await this.canadaPostService.getRates(rateRequest);
            // Cache the rates for 30 minutes
            await cache_service_1.cacheService.cacheShippingRates(cacheKey, rates, 1800);
            res.json(rates);
        }
        catch (error) {
            logger_1.logger.error('Error fetching shipping rates:', error);
            if (error instanceof canadaPost_1.CanadaPostError) {
                res.status(error.statusCode).json({
                    error: error.message,
                    code: error.code,
                    helpUrl: error.helpUrl
                });
            }
            else {
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
    async createShipment(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const shipmentRequest = req.body;
            // Create shipment in Canada Post
            const shipment = await this.canadaPostService.createShipment(shipmentRequest);
            // Save to database
            const newShipment = await Shipment_1.Shipment.query().insert({
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
                status: Shipment_1.ShipmentStatus.CREATED
            });
            // Cache the shipment details
            await cache_service_1.cacheService.cacheShipment(shipment.trackingNumber, newShipment);
            res.status(201).json({
                shipmentId: newShipment.id,
                trackingNumber: newShipment.trackingNumber,
                labelUrl: newShipment.labelUrl,
                price: newShipment.totalCost,
                trackingUrl: newShipment.trackingUrl
            });
        }
        catch (error) {
            logger_1.logger.error('Error creating shipment:', error);
            if (error instanceof canadaPost_1.CanadaPostError) {
                res.status(error.statusCode).json({
                    error: error.message,
                    code: error.code,
                    helpUrl: error.helpUrl
                });
            }
            else {
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
    async trackShipment(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const { trackingNumber } = req.params;
            // Check cache first
            const cachedShipment = await cache_service_1.cacheService.getShipment(trackingNumber);
            if (cachedShipment) {
                logger_1.logger.info('Returning cached shipment data');
                res.json(cachedShipment);
                return;
            }
            // If not in cache, fetch from database
            let shipment = await Shipment_1.Shipment.query()
                .findOne({ trackingNumber })
                .withGraphFetched('order');
            // In shipping.controller.ts, update the trackShipment method:
            if (!shipment) {
                // If not in our database, try to get from Canada Post
                const trackingInfo = await this.canadaPostService.trackPackage(trackingNumber);
                // Create a minimal shipment record if it doesn't exist
                shipment = await Shipment_1.Shipment.query().insert({
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
                }); // Temporary type assertion to avoid type errors
            }
            // Cache the shipment details
            await cache_service_1.cacheService.cacheShipment(trackingNumber, shipment);
            res.json({
                trackingNumber: shipment.trackingNumber,
                status: shipment.status,
                service: shipment.serviceName,
                delivered: shipment.status === Shipment_1.ShipmentStatus.DELIVERED,
                deliveryDate: shipment.deliveredAt || null,
                estimatedDeliveryDate: null, // Canada Post might provide this
                events: [] // Would be populated from tracking API
            });
        }
        catch (error) {
            logger_1.logger.error('Error tracking shipment:', error);
            if (error instanceof canadaPost_1.CanadaPostError) {
                res.status(error.statusCode).json({
                    error: error.message,
                    code: error.code,
                    helpUrl: error.helpUrl
                });
            }
            else {
                res.status(500).json({ error: 'Failed to track shipment' });
            }
        }
    }
    /**
     * Map Canada Post tracking status to our internal status
     */
    mapTrackingStatus(canadaPostStatus) {
        const statusMap = {
            'in_transit': Shipment_1.ShipmentStatus.IN_TRANSIT,
            'out_for_delivery': Shipment_1.ShipmentStatus.OUT_FOR_DELIVERY,
            'delivered': Shipment_1.ShipmentStatus.DELIVERED,
            'available_for_pickup': Shipment_1.ShipmentStatus.IN_TRANSIT,
            'in_transit_delayed': Shipment_1.ShipmentStatus.IN_TRANSIT,
            'error': Shipment_1.ShipmentStatus.FAILED
        };
        return statusMap[canadaPostStatus.toLowerCase()] || Shipment_1.ShipmentStatus.PROCESSING;
    }
    handleError(error, res) {
        logger_1.logger.error('Shipping Error:', error);
        if (error instanceof canadaPost_1.CanadaPostError) {
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
exports.ShippingController = ShippingController;
exports.shippingController = new ShippingController();
