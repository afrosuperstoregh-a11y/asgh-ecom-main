"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRateLimit = exports.orderRateLimit = exports.cartRateLimit = exports.searchRateLimit = exports.generalRateLimit = exports.authRateLimit = exports.rateLimit = void 0;
const redis_1 = require("../config/redis");
const ApiError_1 = require("../utils/ApiError");
const rateLimit = (options) => {
    const { windowMs, maxRequests, message = `Too many requests. Please try again later.`, skipSuccessfulRequests = false, keyGenerator = (req) => {
        // Use IP address as default key
        const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
        return ip;
    } } = options;
    return async (req, res, next) => {
        try {
            const key = keyGenerator(req);
            const redisKey = `rate_limit:${key}:${windowMs}`;
            // Get current count
            const current = await redis_1.redisClient.incrementRateLimit(key, windowMs);
            if (current > maxRequests) {
                // Set rate limit headers
                res.set({
                    'X-RateLimit-Limit': maxRequests.toString(),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString()
                });
                return next(ApiError_1.ApiError.tooManyRequests(message));
            }
            // Set rate limit headers
            res.set({
                'X-RateLimit-Limit': maxRequests.toString(),
                'X-RateLimit-Remaining': Math.max(0, maxRequests - current).toString(),
                'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString()
            });
            next();
        }
        catch (error) {
            // If Redis fails, allow the request to proceed
            console.error('Rate limiting error:', error);
            next();
        }
    };
};
exports.rateLimit = rateLimit;
// Predefined rate limiters for common use cases
exports.authRateLimit = (0, exports.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts. Please try again in 15 minutes.'
});
exports.generalRateLimit = (0, exports.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
    message: 'Too many requests. Please try again later.'
});
exports.searchRateLimit = (0, exports.rateLimit)({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 searches per minute
    message: 'Too many search requests. Please try again in a minute.'
});
exports.cartRateLimit = (0, exports.rateLimit)({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 cart operations per minute
    message: 'Too many cart operations. Please try again in a minute.'
});
exports.orderRateLimit = (0, exports.rateLimit)({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 orders per hour
    message: 'Too many order attempts. Please try again in an hour.'
});
// User-specific rate limiter (for authenticated users)
exports.userRateLimit = (0, exports.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 200, // 200 requests per 15 minutes for authenticated users
    keyGenerator: (req) => {
        const user = req.user;
        return user ? `user:${user.userId}` : req.ip;
    }
});
