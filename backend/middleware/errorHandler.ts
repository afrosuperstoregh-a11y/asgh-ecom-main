import { Request, Response, NextFunction } from 'express'

// Custom Error class since global Error is not available
class CustomError {
  name: string = 'Error'
  message: string
  stack?: string

  constructor(message: string) {
    this.message = message
    this.stack = 'Stack trace not available'
  }
}

export interface ApiError extends CustomError {
  statusCode?: number
  code?: string
  details?: any
}

export function createError(message: string, statusCode: number = 500, code?: string, details?: any): ApiError {
  const error = new CustomError(message) as ApiError
  error.statusCode = statusCode
  error.code = code
  error.details = details
  return error
}

export function globalErrorHandler(err: ApiError, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    code: err.code,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  })

  // Default error response
  let statusCode = err.statusCode || 500
  let errorCode = err.code || (statusCode < 500 ? 'CLIENT_ERROR' : 'INTERNAL_ERROR')
  let message = err.message

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400
    errorCode = 'VALIDATION_ERROR'
  }

  if (err.name === 'CastError') {
    statusCode = 400
    errorCode = 'INVALID_ID'
    message = 'The provided ID is not valid'
  }

  // Supabase specific errors
  const errorMessage = err.message as string
  // @ts-ignore
  if (errorMessage.indexOf('PGRST116') !== -1) {
    statusCode = 404
    errorCode = 'NOT_FOUND'
    message = 'Record not found'
  }

  // @ts-ignore
  if (errorMessage.indexOf('23505') !== -1) {
    statusCode = 409
    errorCode = 'DUPLICATE_ENTRY'
    message = 'This record already exists'
  }

  // @ts-ignore
  if (errorMessage.indexOf('23503') !== -1) {
    statusCode = 400
    errorCode = 'REFERENCE_ERROR'
    message = 'Referenced record does not exist'
  }

  // @ts-ignore
  if (errorMessage.indexOf('23514') !== -1) {
    statusCode = 400
    errorCode = 'CONSTRAINT_VIOLATION'
    message = 'Data constraint violation'
  }

  // JWT/Auth errors
  // @ts-ignore
  if (errorMessage.indexOf('jwt') !== -1 || errorMessage.indexOf('token') !== -1) {
    statusCode = 401
    errorCode = 'AUTHENTICATION_ERROR'
    message = 'Authentication failed'
  }

  // Zod validation errors
  // @ts-ignore
  if (errorMessage.indexOf('ZodError') !== -1) {
    statusCode = 400
    errorCode = 'VALIDATION_ERROR'
  }

  // Rate limiting errors
  // @ts-ignore
  if (errorMessage.indexOf('Too many requests') !== -1) {
    statusCode = 429
    errorCode = 'RATE_LIMIT_EXCEEDED'
  }

  // Build error response
  const errorResponse: any = {
    success: false,
    error: {
      message,
      code: errorCode
    }
  }

  // Include details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.details = err.details
    errorResponse.error.stack = err.stack
  }

  res.status(statusCode).json(errorResponse)
}

// Async error wrapper
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void | any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// 404 handler
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: {
      message: `Cannot ${req.method} ${req.originalUrl}`,
      code: 'NOT_FOUND'
    }
  })
}
