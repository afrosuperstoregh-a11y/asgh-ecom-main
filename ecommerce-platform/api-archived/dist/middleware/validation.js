"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiVersion = exports.requestSizeLimit = exports.corsMiddleware = exports.requestLogger = exports.securityHeaders = exports.sanitizeInput = exports.validateRequest = void 0;
const express_validator_1 = require("express-validator");
const ApiError_1 = require("../utils/ApiError");
const validateRequest = (validations) => {
    return async (req, res, next) => {
        // Run all validations
        await Promise.all(validations.map(validation => validation.run(req)));
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => ({
                field: error.type === 'field' ? error.path : 'unknown',
                message: error.msg,
                value: error.type === 'field' ? error.value : undefined
            }));
            return next(ApiError_1.ApiError.badRequest(`Validation failed: ${errorMessages.map(e => e.message).join(', ')}`));
        }
        next();
    };
};
exports.validateRequest = validateRequest;
// Sanitization middleware
const sanitizeInput = (req, res, next) => {
    // Sanitize body
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    // Sanitize query parameters
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    // Sanitize URL parameters
    if (req.params) {
        req.params = sanitizeObject(req.params);
    }
    next();
};
exports.sanitizeInput = sanitizeInput;
// Helper function to sanitize objects recursively
function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }
    const sanitized = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            if (typeof value === 'string') {
                // Basic string sanitization
                sanitized[key] = value
                    .trim()
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
                    .replace(/<[^>]*>/g, ''); // Remove HTML tags
            }
            else if (typeof value === 'object') {
                sanitized[key] = sanitizeObject(value);
            }
            else {
                sanitized[key] = value;
            }
        }
    }
    return sanitized;
}
// Security headers middleware
const securityHeaders = (req, res, next) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Content Security Policy (basic)
    res.setHeader('Content-Security-Policy', "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self'; " +
        "connect-src 'self'");
    // HSTS (only in production)
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
};
exports.securityHeaders = securityHeaders;
// Request logging middleware
const requestLogger = (req, res, next) => {
    const start = Date.now();
    // Log request
    console.log(`${req.method} ${req.originalUrl} - ${req.ip || 'unknown'}`);
    // Log response
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logLevel = res.statusCode >= 400 ? 'error' : res.statusCode >= 300 ? 'warn' : 'info';
        console.log(`${logLevel.toUpperCase()}: ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    });
    next();
};
exports.requestLogger = requestLogger;
// CORS middleware with specific origins
const corsMiddleware = (req, res, next) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-ID');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
};
exports.corsMiddleware = corsMiddleware;
// Request size limiter
const requestSizeLimit = (maxSize = 10 * 1024 * 1024) => {
    return (req, res, next) => {
        const contentLength = req.headers['content-length'];
        if (contentLength && parseInt(contentLength) > maxSize) {
            return next(ApiError_1.ApiError.badRequest(`Request entity too large. Maximum size is ${maxSize / 1024 / 1024}MB`));
        }
        next();
    };
};
exports.requestSizeLimit = requestSizeLimit;
// API version middleware
const apiVersion = (version) => {
    return (req, res, next) => {
        req.headers['api-version'] = version;
        res.setHeader('API-Version', version);
        next();
    };
};
exports.apiVersion = apiVersion;
