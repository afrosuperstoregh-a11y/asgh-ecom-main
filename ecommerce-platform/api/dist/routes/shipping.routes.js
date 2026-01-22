"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shipping_controller_1 = require("../controllers/shipping.controller");
const shipping_validator_1 = require("../middleware/shipping.validator");
const validation_middleware_1 = require("../middleware/validation.middleware");
const cache_service_1 = require("../services/cache.service");
const router = (0, express_1.Router)();
// Initialize cache service on startup
cache_service_1.cacheService.connect().catch(err => {
    console.error('Failed to connect to Redis:', err);
    process.exit(1);
});
// Graceful shutdown
process.on('SIGINT', async () => {
    try {
        await cache_service_1.cacheService.disconnect();
        process.exit(0);
    }
    catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});
/**
 * @swagger
 * components:
 *   schemas:
 *     ShippingAddress:
 *       type: object
 *       required:
 *         - name
 *         - address1
 *         - city
 *         - province
 *         - postalCode
 *         - country
 *       properties:
 *         name:
 *           type: string
 *           description: Recipient's full name
 *         company:
 *           type: string
 *           description: Company name (optional)
 *         address1:
 *           type: string
 *           description: Street address line 1
 *         address2:
 *           type: string
 *           description: Street address line 2 (optional)
 *         city:
 *           type: string
 *           description: City
 *         province:
 *           type: string
 *           description: Province/State code (2 letters for Canada/US)
 *         postalCode:
 *           type: string
 *           description: Postal/ZIP code
 *         country:
 *           type: string
 *           description: Country code (2 letters)
 *         phone:
 *           type: string
 *           description: Contact phone number
 *         email:
 *           type: string
 *           format: email
 *           description: Contact email address
 *
 *     ParcelDimensions:
 *       type: object
 *       required:
 *         - length
 *         - width
 *         - height
 *         - weight
 *       properties:
 *         length:
 *           type: number
 *           description: Length in centimeters
 *         width:
 *           type: number
 *           description: Width in centimeters
 *         height:
 *           type: number
 *           description: Height in centimeters
 *         weight:
 *           type: number
 *           description: Weight in kilograms
 *
 *     ShippingRate:
 *       type: object
 *       properties:
 *         serviceCode:
 *           type: string
 *           description: Canada Post service code
 *         serviceName:
 *           type: string
 *           description: Human-readable service name
 *         price:
 *           type: number
 *           description: Shipping price in CAD
 *         deliveryDate:
 *           type: string
 *           format: date
 *           description: Estimated delivery date (YYYY-MM-DD)
 *         deliveryDayOfWeek:
 *           type: string
 *           description: Day of the week for delivery
 *         guaranteedDelivery:
 *           type: boolean
 *           description: Whether delivery is guaranteed
 *
 *     CreateShipmentRequest:
 *       type: object
 *       required:
 *         - sender
 *         - recipient
 *         - parcel
 *         - shippingService
 *       properties:
 *         sender:
 *           $ref: '#/components/schemas/ShippingAddress'
 *         recipient:
 *           $ref: '#/components/schemas/ShippingAddress'
 *         parcel:
 *           $ref: '#/components/schemas/ParcelDimensions'
 *         shippingService:
 *           type: string
 *           description: Canada Post service code (e.g., 'DOM.EP' for Expedited Parcel)
 *         reference:
 *           type: string
 *           description: Optional reference number
 *         description:
 *           type: string
 *           description: Description of contents
 *         options:
 *           type: object
 *           properties:
 *             insuranceValue:
 *               type: number
 *               description: Value to insure in CAD
 *             signatureRequired:
 *               type: boolean
 *               description: Whether signature is required
 *
 *     ShipmentResponse:
 *       type: object
 *       properties:
 *         shipmentId:
 *           type: string
 *           description: Canada Post shipment ID
 *         trackingNumber:
 *           type: string
 *           description: Tracking number
 *         labelUrl:
 *           type: string
 *           description: URL to download the shipping label
 *         price:
 *           type: number
 *           description: Shipping cost in CAD
 *         trackingUrl:
 *           type: string
 *           description: URL to track the shipment
 *
 *     TrackingEvent:
 *       type: object
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *           description: Event date (YYYY-MM-DD)
 *         time:
 *           type: string
 *           description: Event time (HH:MM:SS)
 *         location:
 *           type: string
 *           description: Location where the event occurred
 *         description:
 *           type: string
 *           description: Event description
 *         signatory:
 *           type: string
 *           description: Name of person who signed for the package (if applicable)
 *
 *     TrackingResponse:
 *       type: object
 *       properties:
 *         trackingNumber:
 *           type: string
 *           description: The tracking number
 *         status:
 *           type: string
 *           description: Current status of the shipment
 *         service:
 *           type: string
 *           description: Shipping service used
 *         delivered:
 *           type: boolean
 *           description: Whether the package has been delivered
 *         deliveryDate:
 *           type: string
 *           format: date-time
 *           description: Actual delivery date and time
 *         estimatedDeliveryDate:
 *           type: string
 *           format: date-time
 *           description: Estimated delivery date and time
 *         events:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TrackingEvent'
 */
/**
 * @swagger
 * /api/shipping/rates:
 *   post:
 *     summary: Get shipping rates
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
 *         description: Error fetching shipping rates in CAD
 */
/**
 * @swagger
 * /api/shipping/shipments:
 *   post:
 *     summary: Create a new shipment
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
 */
/**
 * @swagger
 * /api/shipping/tracking/{trackingNumber}:
 *   get:
 *     summary: Track a shipment
 *     tags: [Shipping]
 *     parameters:
 *       - in: path
 *         name: trackingNumber
 *         schema:
 *           type: string
 *         required: true
 *         description: Canada Post tracking number
 *     responses:
 *       200:
 *         description: Tracking information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TrackingResponse'
 */
// Canada Post specific endpoints
router.post('/canada-post/rates', (0, shipping_validator_1.validateGetRates)(), validation_middleware_1.validate, (req, res) => shipping_controller_1.shippingController.getRates(req, res));
router.post('/canada-post/ship', (0, shipping_validator_1.validateCreateShipment)(), validation_middleware_1.validate, (req, res) => shipping_controller_1.shippingController.createShipment(req, res));
router.get('/canada-post/track/:trackingNumber', (0, shipping_validator_1.validateTrackingNumber)(), validation_middleware_1.validate, (req, res) => shipping_controller_1.shippingController.trackShipment(req, res));
// Generic shipping endpoints (can be used to support multiple carriers in the future)
router.post('/rates', (0, shipping_validator_1.validateGetRates)(), validation_middleware_1.validate, (req, res) => shipping_controller_1.shippingController.getRates(req, res));
router.post('/ship', (0, shipping_validator_1.validateCreateShipment)(), validation_middleware_1.validate, (req, res) => shipping_controller_1.shippingController.createShipment(req, res));
router.get('/track/:trackingNumber', (0, shipping_validator_1.validateTrackingNumber)(), validation_middleware_1.validate, (req, res) => shipping_controller_1.shippingController.trackShipment(req, res));
exports.default = router;
