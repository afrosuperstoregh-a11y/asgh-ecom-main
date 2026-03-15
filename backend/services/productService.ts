import { supabase } from '../lib/supabase/server'
import cacheService, { CACHE_CONFIG, CACHE_PATTERNS } from '../lib/cache/redis'
import { createError } from '../middleware/errorHandler'
import type { Database } from '../types/database'

// Helper function to generate Supabase Storage URL
function getSupabaseImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null
  
  // If URL already starts with http, return as-is
  if (imageUrl.startsWith('http')) {
    return imageUrl
  }
  
  // Generate Supabase Storage public URL
  const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321'
  
  // Determine bucket based on filename pattern or default to product-images
  let bucket = 'product-images'
  if (imageUrl.includes('category-') || imageUrl.includes('categories/')) {
    bucket = 'category-images'
  }
  
  // Remove leading slash if present
  const cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl
  
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
        status = 'active',
        featured
      } = options

      const offset = (page - 1) * limit

      // Create cache key
      const cacheKey = `${CACHE_CONFIG.PRODUCTS_LIST.key}:${JSON.stringify({ page, limit, sort, order, category, search, status, featured })}`

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
          categories!inner(name, slug)
        `, { count: 'exact' })

      // Apply filters
      if (status) {
        query = query.eq('status', status)
      }

      if (featured !== undefined) {
        query = query.eq('featured', featured)
      }

      if (category) {
        // Check if category is numeric (ID) or string (slug)
        const isNumeric = /^\d+$/.test(category)
        if (isNumeric) {
          query = query.eq('category_id', parseInt(category))
        } else {
          query = query.eq('categories.slug', category)
        }
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`)
      }

      // Apply sorting
      query = query.order(sort, { ascending: order === 'ASC' })

      // Apply pagination
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) throw error

      // Transform image URLs to full Supabase URLs
      const transformedData = (data || []).map((product: any) => ({
        ...product,
        image_url: getSupabaseImageUrl(product.image_url)
      }))

      const result = {
        products: transformedData,
        pagination: {
          current_page: parseInt(page.toString()),
          total_pages: Math.ceil((count || 0) / limit),
          total_items: count || 0,
          items_per_page: parseInt(limit.toString()),
          has_next: offset + limit < (count || 0),
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

      // Transform image URL to full Supabase URL
      const transformedData = data ? {
        ...(data as any),
        image_url: getSupabaseImageUrl((data as any).image_url)
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
        tags = []
      } = productData

      // Generate slug from name
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now()

      // Insert product
      const insertData: any = {
        name,
        slug,
        description: description || null,
        short_description: short_description || null,
        sku: sku || '',
        price: parseFloat(price.toString()),
        compare_price: compare_price ? parseFloat(compare_price.toString()) : null,
        cost_price: cost_price ? parseFloat(cost_price.toString()) : null,
        category_id: category_id || null,
        status: status as 'active' | 'draft' | 'archived',
        featured,
        inventory_quantity: parseInt(inventory_quantity.toString()),
        track_inventory,
        weight: parseFloat(weight.toString()),
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
      if (tags.length > 0) {
        await this.attachProductTags(data.id, tags)
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
      throw createError(`Failed to fetch categories: ${errorMessage}`, 500, 'CATEGORIES_FETCH_ERROR')
    }
  }
}

export default new ProductService()
