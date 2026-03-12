import { supabase } from '../lib/supabase/server'
import cacheService, { CACHE_CONFIG, CACHE_PATTERNS } from '../lib/cache/redis'
import { createError } from '../middleware/errorHandler'

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
  short_desc?: string
  sku?: string
  price: number
  compare_price?: number | null
  cost?: number | null
  category_id: number
  status?: string
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
        query = query.eq('categories.slug', category)
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

      const result = {
        products: data || [],
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
      throw createError(`Failed to fetch products: ${error.message}`, 500, 'PRODUCT_FETCH_ERROR')
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

      return data
    } catch (error) {
      if (error.statusCode) throw error
      throw createError(`Failed to fetch product: ${error.message}`, 500, 'PRODUCT_FETCH_ERROR')
    }
  }

  // Create new product
  async createProduct(productData: ProductData, userId: string) {
    try {
      const {
        name,
        description,
        short_desc,
        sku,
        price,
        compare_price,
        cost,
        category_id,
        status = 'active',
        featured = false,
        inventory_quantity = 10,
        track_inventory = true,
        weight = 0,
        tags = []
      } = productData

      // Insert product
      const { data, error } = await supabase()
        .from('products')
        .insert({
          name,
          description,
          short_desc,
          sku,
          price: parseFloat(price.toString()),
          compare_price: compare_price ? parseFloat(compare_price.toString()) : null,
          cost: cost ? parseFloat(cost.toString()) : null,
          category_id,
          status,
          featured,
          inventory_quantity: parseInt(inventory_quantity.toString()),
          track_inventory,
          weight: parseFloat(weight.toString()),
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Handle tags if provided
      if (tags.length > 0) {
        await this.attachProductTags(data.id, tags)
      }

      // Invalidate cache
      await cacheService.delPattern(CACHE_PATTERNS.PRODUCTS)

      return data
    } catch (error) {
      if (error.statusCode) throw error
      throw createError(`Failed to create product: ${error.message}`, 500, 'PRODUCT_CREATE_ERROR')
    }
  }

  // Update product
  async updateProduct(id: string | number, productData: Partial<ProductData>, userId: string) {
    try {
      const updateData: any = {
        ...productData,
        updated_at: new Date().toISOString(),
        updated_by: userId
      }

      // Convert numeric fields
      if (updateData.price) updateData.price = parseFloat(updateData.price.toString())
      if (updateData.compare_price) updateData.compare_price = parseFloat(updateData.compare_price.toString())
      if (updateData.cost) updateData.cost = parseFloat(updateData.cost.toString())
      if (updateData.inventory_quantity) updateData.inventory_quantity = parseInt(updateData.inventory_quantity.toString())
      if (updateData.weight) updateData.weight = parseFloat(updateData.weight.toString())

      const { data, error } = await supabase()
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
      if (error.statusCode) throw error
      throw createError(`Failed to update product: ${error.message}`, 500, 'PRODUCT_UPDATE_ERROR')
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
      if (error.statusCode) throw error
      throw createError(`Failed to delete product: ${error.message}`, 500, 'PRODUCT_DELETE_ERROR')
    }
  }

  // Update product stock
  async updateStock(id: string | number, quantity: number, operation: 'set' | 'add' | 'subtract' = 'set') {
    try {
      let query: any

      if (operation === 'set') {
        query = supabase()
          .from('products')
          .update({ 
            inventory_quantity: quantity, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', id)
      } else if (operation === 'add') {
        query = supabase().rpc('increment_stock', { product_id: id, amount: quantity })
      } else if (operation === 'subtract') {
        query = supabase().rpc('decrement_stock', { product_id: id, amount: quantity })
      }

      const { data, error } = await query

      if (error) throw error

      // Invalidate cache
      await cacheService.delPattern(CACHE_PATTERNS.PRODUCTS)

      return data
    } catch (error) {
      throw createError(`Failed to update stock: ${error.message}`, 500, 'STOCK_UPDATE_ERROR')
    }
  }

  // Attach tags to product
  async attachProductTags(productId: string | number, tags: string[]) {
    try {
      const tagRelations = tags.map(tag => ({
        product_id: productId,
        tag_id: typeof tag === 'string' ? tag : tag
      }))

      const { error } = await supabase()
        .from('product_tags')
        .insert(tagRelations)

      if (error) throw error

      return { success: true }
    } catch (error) {
      throw createError(`Failed to attach tags: ${error.message}`, 500, 'TAG_ATTACH_ERROR')
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
      throw createError(`Failed to fetch categories: ${error.message}`, 500, 'CATEGORIES_FETCH_ERROR')
    }
  }
}

export default new ProductService()
