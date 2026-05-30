import { supabase } from '../lib/supabase/server'
import cacheService, { CACHE_CONFIG, CACHE_PATTERNS } from '../lib/cache/redis'
import { createError } from '../middleware/errorHandler'
import type { Database } from '../types/database'

// Type declarations for built-in types
declare const JSON: {
  stringify(value: any): string
}

declare class Error {
  name: string
  message: string
  stack?: string
  constructor(message?: string)
}

declare class RegExp {
  constructor(pattern: string | RegExp, flags?: string)
  test(string: string): boolean
  exec(string: string): RegExpExecArray | null
  source: string
  flags: string
  global: boolean
  ignoreCase: boolean
  multiline: boolean
}

interface RegExpExecArray {
  [index: number]: string
  index: number
  input: string
  length: number
}

// Global function declarations
declare function parseFloat(string: string): number
declare function parseInt(string: string, radix?: number): number

// Global interface declarations for built-in types
declare interface String {
  toLowerCase(): string
  replace(searchValue: string | RegExp, replaceValue: string): string
  toString(): string
}

declare interface Array<T> {
  push(item: T): number
}

// TypeScript utility type declarations
declare type Partial<T> = {
  [P in keyof T]?: T[P];
}

// Helper function to generate Supabase Storage URL
function getSupabaseImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null
  
  // If URL already starts with http, return as-is
  if (typeof imageUrl === 'string' && (imageUrl as any).startsWith && (imageUrl as any).startsWith('http')) {
    return imageUrl
  }
  
  // Generate Supabase Storage public URL
  const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321'
  
  // Determine bucket based on filename pattern or default to product-images
  let bucket = 'product-images'
  if (typeof imageUrl === 'string' && 
      ((imageUrl as any).indexOf('category-') >= 0 || (imageUrl as any).indexOf('categories/') >= 0)) {
    bucket = 'category-images'
  }
  
  // Remove leading slash if present
  const cleanPath = typeof imageUrl === 'string' && (imageUrl as any)[0] === '/' ? 
                    (imageUrl as any).slice(1) : imageUrl
  
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`
}

type Product = Database['public']['Tables']['products']['Row']
type ProductInsert = Database['public']['Tables']['products']['Insert']
type ProductUpdate = Database['public']['Tables']['products']['Update']

interface ProductOptions {
  page?: number
  limit?: number
  sort?: string
  order?: 'ASC' | 'DESC'
  category?: string
  search?: string
  status?: string
  featured?: boolean
}

interface ProductData {
  name: string
  description?: string
  short_description?: string
  sku?: string
  price: number
  compare_price?: number | null
  cost_price?: number | null
  category_id: string | null
  status?: 'active' | 'draft' | 'archived'
  featured?: boolean
  inventory_quantity?: number
  track_inventory?: boolean
  weight?: number
  tags?: string[]
  images?: string[] | null
}

class ProductService {
  // Get products with pagination, filtering, and sorting
  async getProducts(options: ProductOptions = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sort = 'created_at',
        order = 'DESC',
        category,
        search,
        status, // Removed default 'active' filter
        featured
      } = options

      // Allow higher limits for getting all products
      const actualLimit = Math.min(limit, 1000)

      const offset = (page - 1) * actualLimit

      // Create cache key - exclude status to ensure all products are cached together
      const cacheKey = `${CACHE_CONFIG.PRODUCTS_LIST.key}:${JSON.stringify({ page, limit, sort, order, category, search, featured })}`

      // Try to get from cache first
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        return cached
      }

      // Build query
      let query = supabase()
        .from('products')
        .select(`
          *,
          categories(name, slug)
        `, { count: 'exact' })

      // Apply filters
      console.log('DEBUG: Status filter received:', status);
      // Temporarily bypass status filter to ensure all products are returned
      // if (status) {
      //   query = query.eq('status', status)
      // }

      // Fixed: Removed default status filter to show all products

      if (featured !== undefined) {
        query = query.eq('featured', featured)
      }

      if (category) {
        // Try treating as slug first, then fallback to numeric ID
        query = query.eq('categories.slug', category)
        // Since we're using LEFT JOIN, we need to ensure we only get products with matching categories when filtering
        query = query.not('categories.id', 'is', null)
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`)
      }

      // Apply sorting
      query = query.order(sort, { ascending: order === 'ASC' })

      // Apply pagination
      query = query.range(offset, offset + actualLimit - 1)

      const { data, error, count } = await query

      if (error) throw error

      // Transform image URLs to full Supabase URLs
      const transformedData = (data || []).map((product: any) => ({
        ...product,
        images: product.images ? product.images.map((img: string) => getSupabaseImageUrl(img) || img) : [],
        // Keep backward compatibility with old image_url field
        image_url: product.image_url ? getSupabaseImageUrl(product.image_url) : (product.images && product.images.length > 0 ? getSupabaseImageUrl(product.images[0]) : null)
      }))

      const result = {
        products: transformedData,
        pagination: {
          current_page: parseInt(page.toString()),
          total_pages: Math.ceil((count || 0) / actualLimit),
          total_items: count || 0,
          items_per_page: parseInt(actualLimit.toString()),
          has_next: offset + actualLimit < (count || 0),
          has_prev: page > 1
        }
      }

      // Cache the result
      await cacheService.set(cacheKey, result, CACHE_CONFIG.PRODUCTS_LIST.ttl)

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      throw createError(`Failed to fetch products: ${errorMessage}`, 500, 'PRODUCT_FETCH_ERROR')
    }
  }

  // Get single product by ID
  async getProductById(id: string | number) {
    try {
      const { data, error } = await supabase()
        .from('products')
        .select(`
          *,
          categories!inner(name, slug)
        `)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw createError('Product not found', 404, 'PRODUCT_NOT_FOUND')
        }
        throw error
      }

      // Transform image URLs to full Supabase URLs
      const transformedData = data ? {
        ...(data as any),
        images: (data as any).images ? (data as any).images.map((img: string) => getSupabaseImageUrl(img) || img) : [],
        // Keep backward compatibility with old image_url field
        image_url: getSupabaseImageUrl((data as any).image_url) || ((data as any).images && (data as any).images.length > 0 ? getSupabaseImageUrl((data as any).images[0]) : null)
      } : data

      return transformedData
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      throw createError(`Failed to fetch product: ${errorMessage}`, 500, 'PRODUCT_FETCH_ERROR')
    }
  }

  // Get single product by slug
  async getProductBySlug(slug: string) {
    try {
      const { data, error } = await supabase()
        .from('products')
        .select(`
          *,
          categories!inner(name, slug)
        `)
        .eq('slug', slug)
        .eq('status', 'active')
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw error
      }

      // Transform image URLs to full Supabase URLs
      const transformedData = data ? {
        ...(data as any),
        images: (data as any).images ? (data as any).images.map((img: string) => getSupabaseImageUrl(img) || img) : [],
        // Keep backward compatibility with old image_url field
        image_url: getSupabaseImageUrl((data as any).image_url) || ((data as any).images && (data as any).images.length > 0 ? getSupabaseImageUrl((data as any).images[0]) : null)
      } : null

      return transformedData
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      throw createError(`Failed to fetch product by slug: ${errorMessage}`, 500, 'PRODUCT_FETCH_ERROR')
    }
  }

  // Create new product
  async createProduct(productData: ProductData, userId: string) {
    try {
      const {
        name,
        description,
        short_description,
        sku,
        price,
        compare_price,
        cost_price,
        category_id,
        status = 'active',
        featured = false,
        inventory_quantity = 10,
        track_inventory = true,
        weight = 0,
        tags,
        images
      } = productData

      // Ensure tags is an array
      const productTags: string[] = tags || []

      // Generate slug from name
      const slug = ((name as any) || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now()

      // Insert product
      const insertData: any = {
        name,
        slug,
        description: description || null,
        short_description: short_description || null,
        sku: sku || '',
        price: Number(price.toString()),
        compare_price: compare_price ? Number(compare_price.toString()) : null,
        cost_price: cost_price ? Number(cost_price.toString()) : null,
        category_id: category_id || null,
        status: status as 'active' | 'draft' | 'archived',
        featured,
        inventory_quantity: Math.floor(Number(inventory_quantity.toString())) as number,
        track_inventory,
        weight: Number(weight.toString()),
        images: images && images.length > 0 ? images : [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await (supabase()
        .from('products')
        .insert(insertData)
        .select()
        .single() as any)

      if (error) throw error

      // Handle tags if provided
      if (productTags.length > 0) {
        await this.attachProductTags(data.id, productTags)
      }

      // Invalidate cache
      await cacheService.delPattern(CACHE_PATTERNS.PRODUCTS)

      return data
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      throw createError(`Failed to create product: ${errorMessage}`, 500, 'PRODUCT_CREATE_ERROR')
    }
  }

  // Update product
  async updateProduct(id: string | number, productData: Partial<ProductData>, userId: string) {
    try {
      // Create a properly typed update object
      const updateData: Database['public']['Tables']['products']['Update'] = {
        updated_at: new Date().toISOString()
      }

      // Map only the fields that exist in both types
      if (productData.name !== undefined) updateData.name = productData.name
      if (productData.description !== undefined) updateData.description = productData.description
      if (productData.short_description !== undefined) updateData.short_description = productData.short_description
      if (productData.sku !== undefined) updateData.sku = productData.sku
      if (productData.price !== undefined) updateData.price = parseFloat(productData.price.toString())
      if (productData.compare_price !== undefined) updateData.compare_price = productData.compare_price ? parseFloat(productData.compare_price.toString()) : null
      if (productData.cost_price !== undefined) updateData.cost_price = productData.cost_price ? parseFloat(productData.cost_price.toString()) : null
      if (productData.category_id !== undefined) updateData.category_id = productData.category_id
      if (productData.status !== undefined) updateData.status = productData.status
      if (productData.featured !== undefined) updateData.featured = productData.featured
      if (productData.inventory_quantity !== undefined) updateData.inventory_quantity = parseInt(productData.inventory_quantity.toString())
      if (productData.track_inventory !== undefined) updateData.track_inventory = productData.track_inventory
      if (productData.weight !== undefined) updateData.weight = parseFloat(productData.weight.toString())
      if (productData.images !== undefined) updateData.images = productData.images && productData.images.length > 0 ? productData.images : []

      const { data, error } = await (supabase() as any)
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw createError('Product not found', 404, 'PRODUCT_NOT_FOUND')
        }
        throw error
      }

      // Invalidate cache
      await cacheService.delPattern(CACHE_PATTERNS.PRODUCTS)

      return data
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      throw createError(`Failed to update product: ${errorMessage}`, 500, 'PRODUCT_UPDATE_ERROR')
    }
  }

  // Delete product
  async deleteProduct(id: string | number) {
    try {
      const { error } = await supabase()
        .from('products')
        .delete()
        .eq('id', id)

      if (error) {
        if (error.code === 'PGRST116') {
          throw createError('Product not found', 404, 'PRODUCT_NOT_FOUND')
        }
        throw error
      }

      // Invalidate cache
      await cacheService.delPattern(CACHE_PATTERNS.PRODUCTS)

      return { success: true }
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      throw createError(`Failed to delete product: ${errorMessage}`, 500, 'PRODUCT_DELETE_ERROR')
    }
  }

  // Update product stock
  async updateStock(id: string | number, quantity: number, operation: 'set' | 'add' | 'subtract' = 'set') {
    try {
      let data: any
      let error: any

      if (operation === 'set') {
        const result = await (supabase() as any)
          .from('products')
          .update({ 
            inventory_quantity: quantity, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', id)
        data = result.data
        error = result.error
      } else if (operation === 'add') {
        const { data: currentProduct } = await supabase()
          .from('products')
          .select('inventory_quantity')
          .eq('id', id)
          .single() as any
        
        const newQuantity = (currentProduct?.inventory_quantity || 0) + quantity
        const result = await (supabase() as any)
          .from('products')
          .update({ 
            inventory_quantity: Math.max(newQuantity, 0),
            updated_at: new Date().toISOString() 
          })
          .eq('id', id)
        data = result.data
        error = result.error
      } else if (operation === 'subtract') {
        const { data: currentProduct } = await supabase()
          .from('products')
          .select('inventory_quantity')
          .eq('id', id)
          .single() as any
        
        const newQuantity = (currentProduct?.inventory_quantity || 0) - quantity
        const result = await (supabase() as any)
          .from('products')
          .update({ 
            inventory_quantity: Math.max(newQuantity, 0),
            updated_at: new Date().toISOString() 
          })
          .eq('id', id)
        data = result.data
        error = result.error
      }

      if (error) throw error

      // Invalidate cache
      await cacheService.delPattern(CACHE_PATTERNS.PRODUCTS)

      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      throw createError(`Failed to update stock: ${errorMessage}`, 500, 'STOCK_UPDATE_ERROR')
    }
  }

  // Attach tags to product
  async attachProductTags(productId: string | number, tags: string[]) {
    try {
      const supabaseClient = supabase()
      const { error } = await (supabaseClient as any)
        .from('products')
        .update({ 
          tags: tags
        })
        .eq('id', productId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      throw createError(`Failed to attach tags: ${errorMessage}`, 500, 'TAG_ATTACH_ERROR')
    }
  }

  // Get product categories
  async getCategories() {
    try {
      const cacheKey = CACHE_CONFIG.CATEGORIES_LIST.key
      const cached = await cacheService.get(cacheKey)

      if (cached) {
        return cached
      }

      const { data, error } = await supabase()
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error

      const result = data || []

      // Cache the result
      await cacheService.set(cacheKey, result, CACHE_CONFIG.CATEGORIES_LIST.ttl)

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      throw createError(errorMessage, 500, 'CATEGORIES_ERROR')
    }
  }

  // Bulk activate all products
  async bulkActivateProducts(userId: string) {
    try {
      console.log('Starting bulk activation of all products...')
      
      // First, get all products that don't have 'active' status
      const { data: inactiveProducts, error } = await supabase()
        .from('products')
        .select('id, name, status')
        .neq('status', 'active') as { data: { id: string; name: string; status: string }[] | null, error: any }

      if (error) throw error

      console.log(`Found ${inactiveProducts?.length || 0} products to activate`)

      if (!inactiveProducts || inactiveProducts.length === 0) {
        return {
          activated: 0,
          alreadyActive: 0,
          message: 'All products are already active'
        }
      }

      // Update all inactive products to have 'active' status
      const { data: updatedProducts, error: updateError } = await (supabase() as any)
        .from('products')
        .update({ status: 'active' })
        .in('id', inactiveProducts.map(p => p.id))
        .select()

      if (updateError) throw updateError

      console.log(`Successfully activated ${updatedProducts.length} products`)

      // Clear cache to ensure fresh data
      await cacheService.delPattern(`${CACHE_CONFIG.PRODUCTS_LIST.key}:*`)

      return {
        activated: updatedProducts.length,
        alreadyActive: 0,
        message: `Successfully activated ${updatedProducts.length} products`
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      throw createError(errorMessage, 500, 'BULK_ACTIVATE_ERROR')
    }
  }
}

export default new ProductService()
