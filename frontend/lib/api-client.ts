import { supabase } from './supabase'

// API Client for Supabase operations
class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'
  }

  // Generic fetch wrapper
  private async fetch(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error)
      throw error
    }
  }

  // Products API
  async getProducts(params: {
    page?: number
    limit?: number
    category?: string
    search?: string
    sort?: string
    order?: 'ASC' | 'DESC'
    featured?: boolean
  } = {}) {
    const queryParams = new URLSearchParams()
    
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.category) queryParams.append('category', params.category)
    if (params.search) queryParams.append('search', params.search)
    if (params.sort) queryParams.append('sort', params.sort)
    if (params.order) queryParams.append('order', params.order)
    if (params.featured !== undefined) queryParams.append('featured', params.featured.toString())

    const endpoint = `/api/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.fetch(endpoint)
  }

  async getProductById(id: string | number) {
    return this.fetch(`/api/products/${id}`)
  }

  // Categories API
  async getCategories() {
    return this.fetch('/api/categories')
  }

  async getCategoryTree() {
    return this.fetch('/api/categories/tree/all')
  }

  async getCategoryById(id: string | number) {
    return this.fetch(`/api/categories/${id}`)
  }

  // Direct Supabase methods for real-time data
  async getProductsFromSupabase(params: {
    page?: number
    limit?: number
    category?: string
    search?: string
    featured?: boolean
  } = {}) {
    if (!supabase) {
      console.warn('Supabase client not initialized, returning empty result')
      return { success: false, data: [], error: 'Supabase client not initialized' }
    }

    let query = supabase
      .from('products')
      .select(`
        *,
        categories!inner(name, slug)
      `, { count: 'exact' })

    // Apply filters
    if (params.category) {
      query = query.eq('categories.slug', params.category)
    }

    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%,sku.ilike.%${params.search}%`)
    }

    if (params.featured !== undefined) {
      query = query.eq('featured', params.featured)
    }

    // Default to active products
    query = query.eq('status', 'active')

    // Apply pagination
    const page = params.page || 1
    const limit = params.limit || 20
    const offset = (page - 1) * limit

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    return {
      success: true,
      data: {
        products: data || [],
        pagination: {
          current_page: page,
          total_pages: Math.ceil((count || 0) / limit),
          total_items: count || 0,
          items_per_page: limit,
          has_next: offset + limit < (count || 0),
          has_prev: page > 1
        }
      }
    }
  }

  async getCategoriesFromSupabase() {
    if (!supabase) {
      console.warn('Supabase client not initialized, returning empty result')
      return { success: false, data: [], error: 'Supabase client not initialized' }
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error

      // Get product counts for each category
      const categoriesWithCounts = await Promise.all(
        (data || []).map(async (category) => {
          if (!supabase) throw new Error('Supabase client not initialized')
          const { count, error: countError } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)
            .eq('status', 'active')

          return {
            ...category,
            productCount: countError ? 0 : count || 0
          }
        })
      )

      return {
        success: true,
        data: categoriesWithCounts
      }
    } catch (error) {
      console.error('Supabase categories error:', error)
      return {
        success: false,
        error: 'Failed to fetch categories'
      }
    }
  }

  // Real-time subscriptions
  subscribeToProducts(callback: (payload: any) => void) {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return { unsubscribe: () => {} }
    }

    return supabase
      .channel('products_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'products' 
        }, 
        callback
      )
      .subscribe()
  }

  subscribeToCategories(callback: (payload: any) => void) {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return { unsubscribe: () => {} }
    }

    return supabase
      .channel('categories_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'categories' 
        }, 
        callback
      )
      .subscribe()
  }
}

export const apiClient = new ApiClient()
export default apiClient
