import { Request, Response, NextFunction } from 'express'
import { z, ZodSchema } from 'zod'

// Zod schemas for validation
export const schemas = {
  // Product validation schemas
  productCreate: z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    short_desc: z.string().optional(),
    sku: z.string().optional(),
    price: z.number().positive(),
    compare_price: z.number().positive().optional().nullable(),
    cost: z.number().positive().optional().nullable(),
    category_id: z.number().int().positive(),
    status: z.enum(['active', 'inactive', 'draft']).optional().default('active'),
    featured: z.boolean().optional().default(false),
    inventory_quantity: z.number().int().min(0).optional().default(10),
    track_inventory: z.boolean().optional().default(true),
    weight: z.number().min(0).optional().default(0),
    tags: z.array(z.string()).optional().default([])
  }),

  productUpdate: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    short_desc: z.string().optional(),
    sku: z.string().optional(),
    price: z.number().positive().optional(),
    compare_price: z.number().positive().optional().nullable(),
    cost: z.number().positive().optional().nullable(),
    category_id: z.number().int().positive().optional(),
    status: z.enum(['active', 'inactive', 'draft']).optional(),
    featured: z.boolean().optional(),
    inventory_quantity: z.number().int().min(0).optional(),
    track_inventory: z.boolean().optional(),
    weight: z.number().min(0).optional(),
    tags: z.array(z.string()).optional()
  }),

  stockUpdate: z.object({
    quantity: z.number().int(),
    operation: z.enum(['set', 'add', 'subtract']).optional().default('set')
  }),

  // Category validation schemas
  categoryCreate: z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    image_url: z.string().url().optional().nullable(),
    parent_id: z.number().int().positive().optional().nullable(),
    sort_order: z.number().int().min(0).optional().default(0),
    is_active: z.boolean().optional().default(true)
  }),

  categoryUpdate: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    image_url: z.string().url().optional().nullable(),
    parent_id: z.number().int().positive().optional().nullable(),
    sort_order: z.number().int().min(0).optional(),
    is_active: z.boolean().optional()
  }),

  // Query parameter validation
  productQuery: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? Math.min(parseInt(val), 100) : 20),
    sort: z.string().optional(),
    order: z.enum(['ASC', 'DESC']).optional(),
    category: z.string().optional(),
    search: z.string().optional(),
    status: z.string().optional(),
    featured: z.string().optional()
  })
}

// Validation middleware factory
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = source === 'body' ? req.body : 
                   source === 'query' ? req.query : 
                   source === 'params' ? req.params : req.body

      const validatedData = schema.parse(data)

      // Replace request data with validated data
      if (source === 'body') req.body = validatedData
      else if (source === 'query') req.query = validatedData
      else if (source === 'params') req.params = validatedData

      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
              code: err.code
            }))
          }
        })
      }

      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid request data',
          code: 'INVALID_DATA'
        }
      })
    }
  }
}

// Sanitization middleware
export function sanitizeBody(req: Request, res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    const sanitizeObject = (obj: any): any => {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          sanitized[key] = value.trim().replace(/[<>]/g, '')
        } else if (Array.isArray(value)) {
          sanitized[key] = value.map(item => 
            typeof item === 'string' ? item.trim().replace(/[<>]/g, '') : item
          )
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = sanitizeObject(value)
        } else {
          sanitized[key] = value
        }
      }
      return sanitized
    }
    
    req.body = sanitizeObject(req.body)
  }
  
  next()
}

// Export validation middleware
export const validateProductCreate = validate(schemas.productCreate, 'body')
export const validateProductUpdate = validate(schemas.productUpdate, 'body')
export const validateStockUpdate = validate(schemas.stockUpdate, 'body')
export const validateCategoryCreate = validate(schemas.categoryCreate, 'body')
export const validateCategoryUpdate = validate(schemas.categoryUpdate, 'body')
export const validateProductQuery = validate(schemas.productQuery, 'query')
