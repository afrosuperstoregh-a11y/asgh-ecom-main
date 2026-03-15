import { supabase } from './supabase-client'

// Simplified API Client for Supabase operations only
class ApiClient {

  // Products API - Supabase direct only
  async getProductsFromSupabase(params: {
    page?: number
    limit?: number
    category?: string
    search?: string
    featured?: boolean
  } = {}) {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
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

    // Process products to add image URLs from Supabase Storage
    const productsWithImages = await Promise.all(
      (data || []).map(async (product) => {
        const { getProductImageUrl, processImageUrls } = await import('./supabase-storage')
        
        // Handle main image
        let mainImageUrl = '/placeholder-product.svg'
        if (product.image) {
          mainImageUrl = await getProductImageUrl(product.image)
        } else if (product.image_path) {
          mainImageUrl = await getProductImageUrl(product.image_path)
        }
        
        // Handle multiple images array
        let processedImages: string[] = []
        if (product.images && Array.isArray(product.images)) {
          processedImages = await processImageUrls('products', product.images)
        } else if (product.image) {
          processedImages = [mainImageUrl]
        } else if (product.image_path) {
          processedImages = [await getProductImageUrl(product.image_path)]
        }

        return {
          ...product,
          image_url: mainImageUrl,
          images: processedImages.length > 0 ? processedImages : [mainImageUrl]
        }
      })
    )

    return {
      success: true,
      data: {
        products: productsWithImages,
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
      throw new Error('Supabase client not initialized')
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error

      // Get product counts and image URLs for each category
      const categoriesWithCountsAndImages = await Promise.all(
        (data || []).map(async (category) => {
          if (!supabase) throw new Error('Supabase client not initialized')
          
          // Get product count
          const { count, error: countError } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)
            .eq('status', 'active')

          // Get image URL from Supabase Storage
          const { getCategoryImageUrl } = await import('./supabase-storage')
          let imageUrl = '/placeholder-category.svg'
          
          if (category.image) {
            imageUrl = await getCategoryImageUrl(category.image)
          } else if (category.image_path) {
            imageUrl = await getCategoryImageUrl(category.image_path)
          } else if (category.image_url && !category.image_url.includes('placeholder')) {
            // Keep existing image_url if it's valid
            imageUrl = category.image_url
          }

          return {
            ...category,
            image_url: imageUrl,
            productCount: countError ? 0 : count || 0
          }
        })
      )

      return {
        success: true,
        data: categoriesWithCountsAndImages
      }
    } catch (error) {
      console.error('Supabase categories error:', error)
      const errorDetails = error as any
      return {
        success: false,
        error: `Failed to fetch categories: ${errorDetails?.message || 'Unknown error'}`
      }
    }
  }
}

export const apiClient = new ApiClient()
export default apiClient
