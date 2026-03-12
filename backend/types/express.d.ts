/// <reference types="express" />
import { Request } from 'express'
import { RateLimitInfo } from 'express-rate-limit'

declare module 'express' {
  interface Request {
    rateLimit?: RateLimitInfo
    user?: {
      userId: string
      email: string
      role: string
    }
  }
}
