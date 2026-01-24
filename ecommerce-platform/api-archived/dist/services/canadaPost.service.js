"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanadaPostService = void 0;
const axios_1 = __importDefault(require("axios"));
const xml_js_1 = require("xml-js");
const crypto_1 = require("crypto");
const logger_1 = require("../utils/logger");
const canadaPost_1 = require("../types/canadaPost");
// Default configuration with environment variables
const CANADA_POST_CONFIG = {
    development: {
        baseUrl: process.env.CANADA_POST_DEV_BASE_URL || 'https://ct.soa-gw.canadapost.ca',
        apiKey: process.env.CANADA_POST_DEV_KEY || '',
        apiSecret: process.env.CANADA_POST_DEV_SECRET || '',
        customerNumber: process.env.CANADA_POST_DEV_CUSTOMER_NUMBER || '',
    },
    production: {
        baseUrl: process.env.CANADA_POST_PROD_BASE_URL || 'https://soa-gw.canadapost.ca',
        apiKey: process.env.CANADA_POST_PROD_KEY || '',
        apiSecret: process.env.CANADA_POST_PROD_SECRET || '',
        customerNumber: process.env.CANADA_POST_PROD_CUSTOMER_NUMBER || '',
    },
};
// Cache TTL in seconds
const CACHE_TTL = {
    RATES: 3600, // 1 hour
    TRACKING: 300, // 5 minutes
    SERVICE: 86400, // 24 hours
};
class CanadaPostService {
    constructor(redisClient) {
        this.cache = null;
        this.rateLimit = {
            remaining: 100, // Default rate limit
            reset: 0,
            limit: 100,
        };
        this.handleRequest = (config) => {
            // Your existing implementation
            if (this.rateLimit.remaining <= 0) {
                const now = Date.now();
                if (now < this.rateLimit.reset) {
                    const waitTime = Math.ceil((this.rateLimit.reset - now) / 1000);
                    throw new canadaPost_1.CanadaPostError(`Rate limit exceeded. Please try again in ${waitTime} seconds`, 'RATE_LIMIT_EXCEEDED', 429);
                }
            }
            return config;
        };
        this.handleResponse = (response) => {
            // Update rate limit from headers if available
            if (response.headers) {
                const remaining = parseInt(response.headers['x-ratelimit-remaining'], 10);
                const limit = parseInt(response.headers['x-ratelimit-limit'], 10);
                const reset = parseInt(response.headers['x-ratelimit-reset'], 10) * 1000; // Convert to ms
                if (!isNaN(remaining) && !isNaN(limit) && !isNaN(reset)) {
                    this.rateLimit = { remaining, limit, reset };
                }
            }
            return response;
        };
        this.handleError = (error) => {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                const { status, data } = error.response;
                let message = 'Canada Post API error';
                let code = 'API_ERROR';
                try {
                    const errorData = typeof data === 'string' ? (0, xml_js_1.xml2js)(data, { compact: true }) : data;
                    const errorMessage = errorData?.['messages']?.['message']?.['_text'] || 'Unknown error';
                    const errorCode = errorData?.['messages']?.['message']?.['code']?.['_text'] || 'UNKNOWN_ERROR';
                    message = errorMessage;
                    code = errorCode;
                }
                catch (e) {
                    logger_1.logger.error('Failed to parse Canada Post error response', { error: e });
                }
                throw new canadaPost_1.CanadaPostError(message, code, status, 'https://www.canadapost.ca/cpo/mc/business/productsservices/developers/services/rating/getrates/default.jsf');
            }
            else if (error.request) {
                // The request was made but no response was received
                throw new canadaPost_1.CanadaPostError('No response received from Canada Post', 'NO_RESPONSE', 504);
            }
            else {
                // Something happened in setting up the request
                throw new canadaPost_1.CanadaPostError(error.message, 'REQUEST_ERROR', 500);
            }
        };
        const env = (process.env.CANADA_POST_ENV || 'development');
        this.config = {
            env,
            ...CANADA_POST_CONFIG[env],
        };
        if (redisClient) {
            this.cache = redisClient;
        }
        this.client = axios_1.default.create({
            baseURL: this.config.baseUrl,
            headers: {
                'Content-Type': 'application/vnd.cpc.ship.rate-v4+xml',
                'Accept': 'application/vnd.cpc.ship.rate-v4+xml',
                'Accept-language': 'en-CA',
            },
            auth: {
                username: this.config.apiKey,
                password: this.config.apiSecret,
            },
            timeout: 10000,
        });
        // Add request interceptor for rate limiting
        this.client.interceptors.request.use(this.handleRequest);
        // Add response interceptor for error handling and rate limit tracking
        this.client.interceptors.response.use(this.handleResponse, this.handleError);
    }
    async getFromCache(key) {
        if (!this.cache)
            return null;
        try {
            const cached = await this.cache.get(key);
            return cached ? JSON.parse(cached) : null;
        }
        catch (error) {
            logger_1.logger.error('Cache get error', { error });
            return null;
        }
    }
    async setCache(key, value, ttl) {
        if (!this.cache)
            return;
        try {
            await this.cache.setex(key, ttl, JSON.stringify(value));
        }
        catch (error) {
            logger_1.logger.error('Cache set error', { error });
        }
    }
    generateRequestId() {
        return (0, crypto_1.createHash)('sha256')
            .update(Date.now().toString() + Math.random().toString())
            .digest('hex')
            .substring(0, 16);
    }
    async getRates(request) {
        const cacheKey = `canadapost:rates:${(0, crypto_1.createHash)('sha256')
            .update(JSON.stringify(request))
            .digest('hex')}`;
        // Try to get from cache first
        const cached = await this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }
        const xml = this.buildRateRequestXml(request);
        const response = await this.client.post(`/rs/ship/price`, xml, {
            headers: {
                'Content-Type': 'application/vnd.cpc.ship.rate-v4+xml',
                'Accept': 'application/vnd.cpc.ship.rate-v4+xml',
                'x-request-id': this.generateRequestId(),
            },
        });
        const rates = this.parseRateResponse(response.data);
        // Cache the result
        await this.setCache(cacheKey, rates, CACHE_TTL.RATES);
        return rates;
    }
    buildRateRequestXml(request) {
        const { originPostalCode, destination, parcel, options } = request;
        return `<?xml version="1.0" encoding="UTF-8"?>
      <mailing-scenario xmlns="http://www.canadapost.ca/ws/ship/rate-v4">
        <customer-number>${this.config.customerNumber}</customer-number>
        <parcel-characteristics>
          <weight>${parcel.weight}</weight>
          ${parcel.length ? `<dimensions>
            <length>${parcel.length}</length>
            <width>${parcel.width}</width>
            <height>${parcel.height}</height>
          </dimensions>` : ''}
        </parcel-characteristics>
        <origin-postal-code>${originPostalCode}</origin-postal-code>
        <destination>
          <domestic>
            <postal-code>${destination.postalCode}</postal-code>
          </domestic>
        </destination>
        ${options?.signatureRequired ? '<options><option><option-code>SO</option-code></option></options>' : ''}
      </mailing-scenario>`;
    }
    parseRateResponse(data) {
        try {
            const result = [];
            const quotes = data['price-quotes']?.['price-quote'] || [];
            if (!Array.isArray(quotes)) {
                throw new canadaPost_1.CanadaPostError('Invalid response format from Canada Post', 'INVALID_RESPONSE');
            }
            for (const quote of quotes) {
                const serviceCode = quote['service-code']?.[0]?.['_text'];
                const serviceName = quote['service-name']?.[0]?.['_text'];
                const price = parseFloat(quote['price-details']?.[0]?.['due']?.[0]?.['_text'] || '0');
                const deliveryDate = quote['service-standard']?.[0]?.['expected-delivery-date']?.[0]?.['_text'];
                if (serviceCode && serviceName && !isNaN(price)) {
                    result.push({
                        serviceCode,
                        serviceName,
                        price,
                        deliveryDate: deliveryDate || '',
                        deliveryDayOfWeek: deliveryDate ? new Date(deliveryDate).toLocaleDateString('en-US', { weekday: 'long' }) : '',
                    });
                }
            }
            return result.sort((a, b) => a.price - b.price);
        }
        catch (error) {
            logger_1.logger.error('Failed to parse Canada Post rates response', { error, data });
            throw new canadaPost_1.CanadaPostError('Failed to parse shipping rates', 'PARSE_ERROR', 500);
        }
    }
    async createShipment(request) {
        const xml = this.buildCreateShipmentXml(request);
        const response = await this.client.post(`/rs/${this.config.customerNumber}/${this.config.customerNumber}/shipment`, xml, {
            headers: {
                'Content-Type': 'application/vnd.cpc.ship.rate-v4+xml',
                'Accept': 'application/vnd.cpc.ship.rate-v4+xml',
                'x-request-id': this.generateRequestId(),
            },
        });
        return this.parseShipmentResponse(response.data);
    }
    buildCreateShipmentXml(request) {
        const { sender, recipient, parcel, reference, description, shippingService, options } = request;
        return `<?xml version="1.0" encoding="UTF-8"?>
      <non-contract-shipment xmlns="http://www.canadapost.ca/ws/shipment-v8">
        <requested-shipping-point>${sender.postalCode.replace(/\s+/g, '')}</requested-shipping-point>
        <delivery-spec>
          <sender>
            <company>${sender.company || ''}</company>
            <contact-phone>${sender.phone || ''}</contact-phone>
            <address-details>
              <address-line-1>${sender.address1}</address-line-1>
              ${sender.address2 ? `<address-line-2>${sender.address2}</address-line-2>` : ''}
              <city>${sender.city}</city>
              <prov-state>${sender.province}</prov-state>
              <postal-zip-code>${sender.postalCode.replace(/\s+/g, '')}</postal-zip-code>
              <country-code>${sender.country}</country-code>
            </address-details>
          </sender>
          <destination>
            <name>${recipient.name}</name>
            <company>${recipient.company || ''}</company>
            <client-voice-number>${recipient.phone || ''}</client-voice-number>
            <address-details>
              <address-line-1>${recipient.address1}</address-line-1>
              ${recipient.address2 ? `<address-line-2>${recipient.address2}</address-line-2>` : ''}
              <city>${recipient.city}</city>
              <prov-state>${recipient.province}</prov-state>
              <postal-zip-code>${recipient.postalCode.replace(/\s+/g, '')}</postal-zip-code>
              <country-code>${recipient.country}</country-code>
            </address-details>
          </destination>
          <options>
            <option>
              <option-code>DC</option-code>
            </option>
            ${options?.signatureRequired ? '<option><option-code>SO</option-code></option>' : ''}
            ${options?.insuranceValue ? `
            <option>
              <option-code>COV</option-code>
              <option-amount>${options.insuranceValue}</option-amount>
            </option>` : ''}
          </options>
          <parcel-characteristics>
            <weight>${parcel.weight}</weight>
            <dimensions>
              <length>${parcel.length}</length>
              <width>${parcel.width}</width>
              <height>${parcel.height}</height>
            </dimensions>
          </parcel-characteristics>
          <notification>
            <email>${recipient.email || ''}</email>
            <on-shipment>true</on-shipment>
            <on-exception>true</on-exception>
            <on-delivery>true</on-delivery>
          </notification>
          <preferences>
            <show-packing-instructions>true</show-packing-instructions>
            <show-postage-rate>true</show-postage-rate>
            <show-insured-value>true</show-insured-value>
          </preferences>
          <references>
            <customer-ref-1>${reference || ''}</customer-ref-1>
            ${description ? `<description>${description.substring(0, 45)}</description>` : ''}
          </references>
        </delivery-spec>
        <print-preferences>
          <output-format>8.5x11</output-format>
          <encoding>PDF</encoding>
        </print-preferences>
        <settlement-info>
          <paid-by-customer-number>${this.config.customerNumber}</paid-by-customer-number>
          <contract-id>${this.config.contractNumber || ''}</contract-id>
        </settlement-info>
      </non-contract-shipment>`;
    }
    parseShipmentResponse(data) {
        try {
            const shipmentInfo = data['non-contract-shipment-info'];
            if (!shipmentInfo) {
                throw new canadaPost_1.CanadaPostError('Invalid shipment response', 'INVALID_RESPONSE');
            }
            const trackingNumber = shipmentInfo['tracking-pin']?.[0]?.['_text'];
            const shipmentId = shipmentInfo['shipment-id']?.[0]?.['_text'];
            const labelUrl = shipmentInfo['label']?.[0]?.['url']?.[0]?.['_text'];
            const price = parseFloat(shipmentInfo['priced-options']?.[0]?.['priced-option']?.[0]?.['price-details']?.[0]?.['due']?.[0]?.['_text'] || '0');
            if (!trackingNumber || !shipmentId || !labelUrl) {
                throw new canadaPost_1.CanadaPostError('Incomplete shipment response', 'INCOMPLETE_RESPONSE');
            }
            return {
                shipmentId,
                trackingNumber,
                labelUrl: `${this.config.baseUrl}${labelUrl}`,
                price,
                trackingUrl: `https://www.canadapost.ca/track-repackage/track-e.html?LOCALE=en&trackingNumber=${trackingNumber}`,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to parse shipment response', { error, data });
            throw new canadaPost_1.CanadaPostError(error instanceof Error ? error.message : 'Failed to parse shipment response', 'PARSE_ERROR', 500);
        }
    }
    async trackPackage(trackingNumber) {
        const cacheKey = `canadapost:tracking:${trackingNumber}`;
        // Try to get from cache first
        const cached = await this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }
        const response = await this.client.get(`/vis/track/pin/${trackingNumber}/summary`, {
            headers: {
                'Accept': 'application/vnd.cpc.track+xml',
                'x-request-id': this.generateRequestId(),
            },
        });
        const trackingInfo = this.parseTrackingResponse(response.data);
        // Cache the result
        await this.setCache(cacheKey, trackingInfo, CACHE_TTL.TRACKING);
        return trackingInfo;
    }
    parseTrackingResponse(data) {
        try {
            const trackingDetail = data['tracking-detail'];
            if (!trackingDetail) {
                throw new canadaPost_1.CanadaPostError('Invalid tracking response', 'INVALID_RESPONSE');
            }
            const events = [];
            const status = trackingDetail['pin-summary']?.[0]?.['event-status']?.[0]?.['_text'] || 'UNKNOWN';
            const service = trackingDetail['service-name']?.[0]?.['_text'] || 'Unknown Service';
            const delivered = status === 'Delivered';
            const deliveryDate = trackingDetail['delivery-details']?.[0]?.['date']?.[0]?.['_text'];
            const estimatedDeliveryDate = trackingDetail['expected-delivery-date']?.[0]?.['_text'];
            // Parse events
            const eventList = trackingDetail['significant-events']?.[0]?.['occurrence'] || [];
            for (const event of Array.isArray(eventList) ? eventList : [eventList]) {
                events.push({
                    date: event['event-date']?.[0]?.['_text'] || '',
                    time: event['event-time']?.[0]?.['_text'] || '',
                    location: [
                        event['event-site']?.[0]?.['_text'],
                        event['event-province']?.[0]?.['_text'],
                        event['event-country']?.[0]?.['_text']
                    ].filter(Boolean).join(', '),
                    description: event['event-description']?.[0]?.['_text'] || 'No description',
                    signatory: event['signatory-name']?.[0]?.['_text'],
                });
            }
            return {
                trackingNumber: trackingDetail['pin']?.[0]?.['_text'] || '',
                status,
                service,
                delivered,
                deliveryDate: deliveryDate || null,
                estimatedDeliveryDate: estimatedDeliveryDate || null,
                events,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to parse tracking response', { error, data });
            throw new canadaPost_1.CanadaPostError('Failed to parse tracking information', 'PARSE_ERROR', 500);
        }
    }
}
exports.CanadaPostService = CanadaPostService;
