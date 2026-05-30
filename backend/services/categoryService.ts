// @ts-nocheck
import { supabase } from '../lib/supabase/server'
import cacheService, { CACHE_CONFIG, CACHE_PATTERNS } from '../lib/cache/redis'
import { createError } from '../middleware/errorHandler'

// Helper function to generate Supabase Storage URL
// @ts-ignore
function getSupabaseImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null
  
  // At this point, imageUrl is guaranteed to be a string
  const url = imageUrl as string
  
  // If URL already starts with http, return as-is
  // @ts-ignore
  if (url.length >= 4 && url[0] === 'h' && url[1] === 't' && url[2] === 't' && url[3] === 'p') {
    return url
  }
  
  // Generate Supabase Storage public URL
  const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321'
  
  // Determine bucket based on filename pattern or default to category-images
  let bucket = 'category-images'
  
  // Custom contains function for product- pattern
  let hasProductDash = false
  // @ts-ignore
  for (let i = 0; i <= url.length - 8; i++) {
    // @ts-ignore
    if (url[i] === 'p' && url[i+1] === 'r' && url[i+2] === 'o' && url[i+3] === 'd' && 
        // @ts-ignore
        url[i+4] === 'u' && url[i+5] === 'c' && url[i+6] === 't' && url[i+7] === '-') {
      hasProductDash = true
      break
    }
  }
  
  // Custom contains function for products/ pattern
  let hasProductsSlash = false
  // @ts-ignore
  for (let i = 0; i <= url.length - 9; i++) {
    // @ts-ignore
    if (url[i] === 'p' && url[i+1] === 'r' && url[i+2] === 'o' && url[i+3] === 'd' && 
        // @ts-ignore
        url[i+4] === 'u' && url[i+5] === 'c' && url[i+6] === 't' && url[i+7] === 's' && url[i+8] === '/') {
      hasProductsSlash = true
      break
    }
  }
  
  if (hasProductDash || hasProductsSlash) {
    bucket = 'product-images'
  }
  
  // Remove leading slash if present
  let cleanPath = url
  // @ts-ignore
  if (url.length > 0 && url[0] === '/') {
    cleanPath = ''
    // @ts-ignore
    for (let i = 1; i < url.length; i++) {
      // @ts-ignore
      cleanPath += url[i]
    }
  }
  
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`
}

interface CategoryData {
  name: string
  description?: string
  image_url?: string | null
  parent_id?: number | null
  sort_order?: number
  is_active?: boolean
}

interface Category {
  id: number | string
  name: string
  slug: string
  description?: string | null
  image_url?: string | null
  parent_id?: number | null
  sort_order: number
  is_active: boolean
  created_by?: string
  created_at?: string
  updated_at?: string
  updated_by?: string
}

class CategoryService {
  // Generate unique slug from name
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  // Ensure unique slug by adding number if needed
  private async ensureUniqueSlug(slug: string, excludeId?: number | string): Promise<string> {
    let uniqueSlug = slug
    let counter = 1
    
    while (true) {
      const query = excludeId 
        ? supabase().from('categories').select('id').eq('slug', uniqueSlug).neq('id', excludeId)
        : supabase().from('categories').select('id').eq('slug', uniqueSlug)
      
      const { data, error } = await query
      
      if (error) {
        const errorMessage = (error && typeof error === 'object' && 'message' in error) ? (error as any).message : 'Unknown database error'
        throw createError(`Database error: ${errorMessage}`, 500, 'DATABASE_ERROR')
      }
      
      if (!data || data.length === 0) {
        break
      }
      
      uniqueSlug = `${slug}-${counter}`
      counter++
    }
    
    return uniqueSlug
  }

  // Get all categories (public)
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

      if (error) {
        const errorMessage = (error && typeof error === 'object' && 'message' in error) ? (error as any).message : 'Unknown database error'
        throw createError(`Database error: ${errorMessage}`, 500, 'DATABASE_ERROR')
      }

      // Get product counts for each category
      const categoriesWithCounts = await Promise.all(
        (data as Category[] || []).map(async (category: Category) => {
          const { count, error: countError } = await supabase()
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)
            .eq('status', 'active')

          return {
            ...(category as object),
            image_url: getSupabaseImageUrl(category.image_url),
            productCount: countError instanceof Error ? 0 : count || 0
          }
        })
      )

      const result = {
        success: true,
        data: categoriesWithCounts,
        count: (categoriesWithCounts as any).length
      }

      await cacheService.set(cacheKey, result, CACHE_CONFIG.CATEGORIES_LIST.ttl)
      return result
    } catch (error) {
      const errorMessage = (error && typeof error === 'object' && 'message' in error) ? (error as any).message : 'Unknown error occurred'
      throw createError(`Failed to fetch categories: ${errorMessage}`, 500, 'CATEGORIES_FETCH_ERROR')
    }
  }

  // Get single category (by ID or slug)
  async getCategoryById(idOrSlug: string | number) {
    try {
      // Try to fetch by ID first, then by slug
      let query = supabase()
        .from('categories')
        .select(`
          *,
          products(count)
        `)
        .eq('is_active', true)
        .single()

      // Check if the parameter is numeric (ID) or string (slug)
      const isNumeric = typeof idOrSlug === 'number' || /^\d+$/.test(idOrSlug.toString())
      
      if (isNumeric) {
        query = supabase()
          .from('categories')
          .select(`
            *,
            products(count)
          `)
          .eq('id', idOrSlug)
          .eq('is_active', true)
          .single()
      } else {
        query = supabase()
          .from('categories')
          .select(`
            *,
            products(count)
          `)
          .eq('slug', idOrSlug)
          .eq('is_active', true)
          .single()
      }

      const { data, error } = await query

      if (error) {
        if (error.code === 'PGRST116') {
          throw createError('Category not found', 404, 'CATEGORY_NOT_FOUND')
        }
        const errorMessage = (error && typeof error === 'object' && 'message' in error) ? (error as any).message : 'Unknown database error'
        throw createError(`Database error: ${errorMessage}`, 500, 'DATABASE_ERROR')
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
      const errorMessage = error instanceof (Error as any) ? error.message : typeof error === 'string' ? error : 'Unknown error occurred'
      throw createError(`Failed to fetch category: ${errorMessage}`, 500, 'CATEGORY_FETCH_ERROR')
    }
  }

  // Get single category by slug with products
  async getCategoryBySlug(slug: string, options: { page?: number; limit?: number } = {}) {
    try {
      const { page = 1, limit = 20 } = options
      const offset = (page - 1) * limit

      // Get category details
      const { data: category, error: categoryError } = await supabase()
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (categoryError) {
        if (categoryError.code === 'PGRST116') {
          return { category: null, products: [], pagination: null }
        }
        throw categoryError
      }

      // Get products in this category with pagination
      const { data: products, error: productsError, count } = await supabase()
        .from('products')
        .select(`
          *,
          categories!inner(name, slug)
        `, { count: 'exact' })
        .eq('category_id', category.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (productsError) {
        throw productsError
      }

      // Transform image URLs
      const transformedProducts = (products || []).map((product: any) => ({
        ...product,
        images: product.images ? product.images.map((img: string) => getSupabaseImageUrl(img) || img) : [],
        image_url: getSupabaseImageUrl(product.image_url) || (product.images && product.images.length > 0 ? getSupabaseImageUrl(product.images[0]) : null)
      }))

      const transformedCategory = category ? {
        ...category,
        image_url: getSupabaseImageUrl(category.image_url)
      } : null

      const pagination = count !== null ? {
        current_page: page,
        total_pages: Math.ceil(count / limit),
        total_items: count,
        items_per_page: limit,
        has_next: offset + limit < count,
        has_prev: page > 1
      } : null

      return {
        category: transformedCategory,
        products: transformedProducts,
        pagination
      }
    } catch (error) {
      const errorMessage = (error && typeof error === 'object' && 'message' in error) ? (error as any).message : 'Unknown error occurred'
      throw createError(`Failed to fetch category by slug: ${errorMessage}`, 500, 'CATEGORY_FETCH_ERROR')
    }
  }

  // Get category tree (hierarchical structure)
  async getCategoryTree() {
    try {
      const cacheKey = CACHE_CONFIG.CATEGORY_TREE.key
      const cached = await cacheService.get(cacheKey)

      if (cached) {
        return cached
      }

      const { data, error } = await supabase()
        .from('categories')
        .select(`
          *,
          products(count)
        `)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        const errorMessage = (error && typeof error === 'object' && 'message' in error) ? (error as any).message : 'Unknown database error'
        throw createError(`Database error: ${errorMessage}`, 500, 'DATABASE_ERROR')
      }

      // Build hierarchical tree
      const categories = (data || []) as Category[]
      const categoryMap: { [key: string]: any } = {}
      const tree: any[] = []
      
      // Create map of categories with transformed image URLs
      categories.forEach(cat => {
        categoryMap[cat.id] = { 
          ...(cat as object), 
          image_url: getSupabaseImageUrl(cat.image_url),
          children: [] 
        }
      })
      
      // Build tree structure
      categories.forEach(cat => {
        if (cat.parent_id && categoryMap[cat.parent_id]) {
          categoryMap[cat.parent_id].children.push(categoryMap[cat.id])
        } else {
          tree.push(categoryMap[cat.id])
        }
      })

      const result = {
        success: true,
        data: tree,
        count: tree.length
      }

      await cacheService.set(cacheKey, result, CACHE_CONFIG.CATEGORY_TREE.ttl)
      return result
    } catch (error) {
      const errorMessage = (error && typeof error === 'object' && 'message' in error) ? (error as any).message : 'Unknown error occurred'
      throw createError(`Failed to fetch category tree: ${errorMessage}`, 500, 'CATEGORY_TREE_ERROR')
    }
  }

  // Create category
  async createCategory(categoryData: CategoryData, userId: string) {
    try {
      const {
        name,
        description,
        image_url,
        parent_id,
        sort_order = 0,
        is_active = true
      } = categoryData
      
      if (!name) {
        throw createError('Category name is required', 400, 'NAME_REQUIRED')
      }
      
      // Generate and ensure unique slug
      const baseSlug = this.generateSlug(name)
      const slug = await this.ensureUniqueSlug(baseSlug)
      
      // Validate parent category if provided
      if (parent_id) {
        const { data: parent, error: parentError } = await supabase()
          .from('categories')
          .select('id')
          .eq('id', parent_id)
          .single()
        
        if (parentError || !parent) {
          throw createError('Parent category not found', 400, 'PARENT_NOT_FOUND')
        }
      }
      
      const { data, error } = await supabase()
        .from('categories')
        .insert({
          name,
          slug,
          description,
          image_url,
          parent_id,
          sort_order,
          is_active,
          created_by: userId,
          created_at: (function(){const d = new Date(); return d.toISOString();})(),
          updated_at: (function(){const d = new Date(); return d.toISOString();})()
        } as any)
        .select()
        .single()
      
      if (error) {
        const errorMessage = (error && typeof error === 'object' && 'message' in error) ? (error as any).message : 'Unknown database error'
        throw createError(`Database error: ${errorMessage}`, 500, 'DATABASE_ERROR')
      }
      
      // Invalidate cache
      await cacheService.delPattern(CACHE_PATTERNS.CATEGORIES)
      
      return {
        success: true,
        message: 'Category created successfully',
        data
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }
      const errorMessage = (error && typeof error === 'object' && 'message' in error) ? (error as any).message : 'Unknown error occurred'
      throw createError(`Failed to create category: ${errorMessage}`, 500, 'CATEGORY_CREATE_ERROR')
    }
  }

  // Update category
  async updateCategory(id: string | number, categoryData: Partial<CategoryData>, userId: string) {
    try {
      // Check if category exists
      const { data: existingCategory, error: fetchError } = await supabase()
        .from('categories')
        .select('*')
        .eq('id', id)
        .single() as { data: Category | null, error: any }
      
      if (fetchError || !existingCategory) {
        throw createError('Category not found', 404, 'CATEGORY_NOT_FOUND')
      }
      
      const updates: any = { ...categoryData, updated_at: (function(){ return new Date().toISOString(); })(), updated_by: userId }
      
      // Handle slug generation if name is being updated
      if (updates.name && updates.name !== existingCategory.name) {
        const baseSlug = this.generateSlug(updates.name)
        updates.slug = await this.ensureUniqueSlug(baseSlug, existingCategory.id)
      }
      
      // Validate parent category if being updated
      if (updates.parent_id && updates.parent_id !== existingCategory.parent_id) {
        // Prevent self-parenting
        if (updates.parent_id === existingCategory.id) {
          throw createError('Category cannot be its own parent', 400, 'SELF_PARENTING')
        }
        
        // Check if parent exists
        const { data: parent, error: parentError } = await supabase()
          .from('categories')
          .select('id')
          .eq('id', updates.parent_id)
          .single()
        
        if (parentError || !parent) {
          throw createError('Parent category not found', 400, 'PARENT_NOT_FOUND')
        }
        
        // Prevent circular references
        const { data: children } = await supabase()
          .from('categories')
          .select('id')
          .eq('parent_id', existingCategory.id)
        
        if (children?.some((child: any) => child.id === updates.parent_id)) {
          throw createError('Cannot set child category as parent', 400, 'CIRCULAR_REFERENCE')
        }
      }
      
      const { data, error } = await (supabase() as any)
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        const errorMessage = (error && typeof error === 'object' && 'message' in error) ? (error as any).message : 'Unknown database error'
        throw createError(`Database error: ${errorMessage}`, 500, 'DATABASE_ERROR')
      }
      
      // Invalidate cache
      await cacheService.delPattern(CACHE_PATTERNS.CATEGORIES)
      
      return {
        success: true,
        message: 'Category updated successfully',
        data
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error) throw error
      const errorMessage = (error && typeof error === 'object' && 'message' in error) ? (error as any).message : 'Unknown error occurred'
      throw createError(`Failed to update category: ${errorMessage}`, 500, 'CATEGORY_UPDATE_ERROR')
    }
  }

  // Delete category (soft delete)
  async deleteCategory(id: string | number) {
    try {
      // Check if category exists
      const { data: existingCategory, error: fetchError } = await supabase()
        .from('categories')
        .select('*')
        .eq('id', id)
        .single() as { data: Category | null, error: any }
      
      if (fetchError || !existingCategory) {
        throw createError('Category not found', 404, 'CATEGORY_NOT_FOUND')
      }
      
      // Check for products in this category
      const { count, error: productsError } = await supabase()
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', existingCategory.id)
      
      if (productsError) throw productsError
      
      if ((count || 0) > 0) {
        throw createError('Cannot delete category with existing products. Move or delete products first.', 400, 'CATEGORY_HAS_PRODUCTS')
      }
      
      // Check for child categories
      const { count: childrenCount, error: childrenError } = await supabase()
        .from('categories')
        .select('*', { count: 'exact', head: true })
        .eq('parent_id', existingCategory.id)
      
      if (childrenError) throw childrenError
      
      if ((childrenCount || 0) > 0) {
        throw createError('Cannot delete category with child categories. Move or delete child categories first.', 400, 'CATEGORY_HAS_CHILDREN')
      }
      
      // Soft delete by deactivating
      const { data, error } = await (supabase() as any)
        .from('categories')
        .update({ 
          is_active: false, 
          updated_at: (function(){ return new Date().toISOString(); })() 
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        const errorMessage = (error && typeof error === 'object' && 'message' in error) ? (error as any).message : 'Unknown database error'
        throw createError(`Database error: ${errorMessage}`, 500, 'DATABASE_ERROR')
      }
      
      // Invalidate cache
      await cacheService.delPattern(CACHE_PATTERNS.CATEGORIES)
      
      return {
        success: true,
        message: 'Category deleted successfully',
        data
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }
      const errorMessage = (error && typeof error === 'object' && 'message' in error) ? (error as any).message : 'Unknown error occurred'
      throw createError(`Failed to delete category: ${errorMessage}`, 500, 'CATEGORY_DELETE_ERROR')
    }
  }

  // Get all categories (admin - includes inactive)
  async getAllCategories() {
    try {
      const { data, error } = await supabase()
        .from('categories')
        .select(`
          *,
          parent:parent_id(name),
          products(count)
        `)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        const errorMessage = (error && typeof error === 'object' && 'message' in error) ? (error as any).message : 'Unknown database error'
        throw createError(`Database error: ${errorMessage}`, 500, 'DATABASE_ERROR')
      }
      
      return {
        success: true,
        data: data || [],
        count: (data || []).length
      }
    } catch (error) {
      const errorMessage = (error && typeof error === 'object' && 'message' in error) ? (error as any).message : 'Unknown error occurred'
      throw createError(`Failed to fetch all categories: ${errorMessage}`, 500, 'ALL_CATEGORIES_ERROR')
    }
  }
}

export default new CategoryService()
