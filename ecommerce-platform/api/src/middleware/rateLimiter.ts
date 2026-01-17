import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis';
import { ApiError } from '../utils/ApiError';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  keyGenerator?: (req: Request) => string; // Custom key generator
}

export const rateLimit = (options: RateLimitOptions) => {
  const {
    windowMs,
    maxRequests,
    message = `Too many requests. Please try again later.`,
    skipSuccessfulRequests = false,
    keyGenerator = (req) => {
      // Use IP address as default key
      const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
      return ip as string;
    }
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = keyGenerator(req);
      const redisKey = `rate_limit:${key}:${windowMs}`;
      
      // Get current count
      const current = await redisClient.incrementRateLimit(key, windowMs);
      
      if (current > maxRequests) {
        // Set rate limit headers
        res.set({
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString()
        });
        
        return next(ApiError.tooManyRequests(message));
      }
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, maxRequests - current).toString(),
        'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString()
      });
      
      next();
    } catch (error) {
      // If Redis fails, allow the request to proceed
      console.error('Rate limiting error:', error);
      next();
    }
  };
};

// Predefined rate limiters for common use cases
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts. Please try again in 15 minutes.'
});

export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
  message: 'Too many requests. Please try again later.'
});

export const searchRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 searches per minute
  message: 'Too many search requests. Please try again in a minute.'
});

export const cartRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20, // 20 cart operations per minute
  message: 'Too many cart operations. Please try again in a minute.'
});

export const orderRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // 10 orders per hour
  message: 'Too many order attempts. Please try again in an hour.'
});

// User-specific rate limiter (for authenticated users)
export const userRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 200, // 200 requests per 15 minutes for authenticated users
  keyGenerator: (req) => {
    const user = (req as any).user;
    return user ? `user:${user.userId}` : req.ip as string;
  }
});
