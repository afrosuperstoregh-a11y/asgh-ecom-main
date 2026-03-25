import { z } from 'zod';

// Product validation schemas
export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200, 'Product name must be less than 200 characters'),
  sku: z.string().min(1, 'SKU is required').max(100, 'SKU must be less than 100 characters'),
  shortDesc: z.string().max(500, 'Short description must be less than 500 characters').optional(),
  description: z.string().min(1, 'Description is required'),
  price: z.number().min(0, 'Price must be positive'),
  comparePrice: z.number().min(0, 'Compare price must be positive').optional(),
  cost: z.number().min(0, 'Cost must be positive').optional(),
  categoryId: z.string().min(1, 'Category is required'),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']),
  featured: z.boolean(),
  trackInventory: z.boolean(),
  stock: z.number().min(0, 'Stock must be positive').optional(),
  weight: z.number().min(0, 'Weight must be positive').optional(),
  dimensions: z.object({
    length: z.number().min(0, 'Length must be positive').optional(),
    width: z.number().min(0, 'Width must be positive').optional(),
    height: z.number().min(0, 'Height must be positive').optional(),
  }).optional(),
  tags: z.array(z.string().max(50, 'Tag must be less than 50 characters')).max(10, 'Maximum 10 tags allowed').optional(),
  images: z.array(z.string().url('Invalid image URL')).max(10, 'Maximum 10 images allowed').optional(),
});

export const productUpdateSchema = productSchema.partial();

// Category validation schemas
export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug must be less than 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  image: z.string().url('Invalid image URL').optional(),
  parentId: z.string().optional(),
  sortOrder: z.number().min(0, 'Sort order must be positive').default(0),
  isActive: z.boolean().default(true),
});

// Customer validation schemas
export const customerUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[+]?[\d\s-()]+$/, 'Invalid phone number').optional(),
  isBlocked: z.boolean(),
  blockReason: z.string().max(500, 'Block reason must be less than 500 characters').optional(),
});

// Order validation schemas
export const orderStatusUpdateSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  notifyCustomer: z.boolean().default(true),
  trackingNumber: z.string().max(100, 'Tracking number must be less than 100 characters').optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
});

// Payment validation schemas
export const refundSchema = z.object({
  amount: z.number().min(0.01, 'Refund amount must be at least 0.01').max(10000, 'Refund amount cannot exceed 10000'),
  reason: z.string().max(500, 'Refund reason must be less than 500 characters').optional(),
});

// Promotion validation schemas
export const promotionSchema = z.object({
  name: z.string().min(1, 'Promotion name is required').max(200, 'Promotion name must be less than 200 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  code: z.string().min(1, 'Promotion code is required').max(50, 'Promotion code must be less than 50 characters')
    .regex(/^[A-Z0-9-_]+$/, 'Promotion code must contain only uppercase letters, numbers, hyphens, and underscores'),
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING', 'BUY_X_GET_Y', 'BULK_DISCOUNT']),
  value: z.number().min(0, 'Value must be positive'),
  minimumAmount: z.number().min(0, 'Minimum amount must be positive').optional(),
  usageLimit: z.number().min(1, 'Usage limit must be at least 1').optional(),
  usageCount: z.number().min(0, 'Usage count must be positive').default(0),
  startsAt: z.string().datetime('Invalid start date'),
  endsAt: z.string().datetime('Invalid end date').optional(),
  isActive: z.boolean().default(true),
  applicableProducts: z.array(z.string()).optional(),
  applicableCategories: z.array(z.string()).optional(),
});

// Role validation schemas
export const roleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(50, 'Role name must be less than 50 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
});

// Settings validation schemas
export const settingSchema = z.object({
  key: z.string().min(1, 'Setting key is required'),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.any()),
    z.record(z.string(), z.any()),
  ]),
  type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
  category: z.string().min(1, 'Category is required'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
});

// Form validation utilities
export const validateForm = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string> } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach((err: any) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { _form: 'Validation failed' } };
  }
};

// Type exports
export type ProductFormData = z.infer<typeof productSchema>;
export type ProductUpdateFormData = z.infer<typeof productUpdateSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
export type CustomerUpdateFormData = z.infer<typeof customerUpdateSchema>;
export type OrderStatusUpdateFormData = z.infer<typeof orderStatusUpdateSchema>;
export type RefundFormData = z.infer<typeof refundSchema>;
export type PromotionFormData = z.infer<typeof promotionSchema>;
export type RoleFormData = z.infer<typeof roleSchema>;
export type SettingFormData = z.infer<typeof settingSchema>;
