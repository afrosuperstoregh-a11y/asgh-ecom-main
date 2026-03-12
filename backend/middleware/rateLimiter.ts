import rateLimit from 'express-rate-limit'
import { Request, Response } from 'express'

// Create rate limiter for product and category APIs
export const catalogRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req: Request) => {
    return req.ip || req.connection.remoteAddress || 'unknown'
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.round((req.rateLimit?.resetTime || 0) - Date.now()) / 1000
      }
    })
  }
})

// Stricter rate limiter for admin operations
export const adminRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // 50 requests per minute per IP for admin operations
  message: {
    success: false,
    error: {
      message: 'Too many admin requests, please try again later.',
      code: 'ADMIN_RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.ip || req.connection.remoteAddress || 'unknown'
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many admin requests, please try again later.',
        code: 'ADMIN_RATE_LIMIT_EXCEEDED',
        retryAfter: Math.round((req.rateLimit?.resetTime || 0) - Date.now()) / 1000
      }
    })
  }
})

// Export rate limiters for different routes
export const rateLimiters = {
  catalog: catalogRateLimiter,
  admin: adminRateLimiter,
  products: catalogRateLimiter,
  categories: catalogRateLimiter
}
