import { supabase } from '../lib/supabase/server'
import cacheService, { CACHE_CONFIG, CACHE_PATTERNS } from '../lib/cache/redis'
import { createError } from '../middleware/errorHandler'

interface CategoryData {
  name: string
  description?: string
  image_url?: string | null
  parent_id?: number | null
  sort_order?: number
  is_active?: boolean
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
      
      if (error) throw error
      
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

      if (error) throw error

      // Get product counts for each category
      const categoriesWithCounts = await Promise.all(
        (data || []).map(async (category) => {
          const { count, error: countError } = await supabase()
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

      const result = {
        success: true,
        categories: categoriesWithCounts,
        count: categoriesWithCounts.length
      }

      await cacheService.set(cacheKey, result, CACHE_CONFIG.CATEGORIES_LIST.ttl)
      return result
    } catch (error) {
      throw createError(`Failed to fetch categories: ${error.message}`, 500, 'CATEGORIES_FETCH_ERROR')
    }
  }

  // Get single category
  async getCategoryById(id: string | number) {
    try {
      const { data, error } = await supabase()
        .from('categories')
        .select(`
          *,
          products(count)
        `)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw createError('Category not found', 404, 'CATEGORY_NOT_FOUND')
        }
        throw error
      }

      return data
    } catch (error) {
      if (error.statusCode) throw error
      throw createError(`Failed to fetch category: ${error.message}`, 500, 'CATEGORY_FETCH_ERROR')
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

      if (error) throw error

      // Build hierarchical tree
      const categories = data || []
      const categoryMap: { [key: string]: any } = {}
      const tree: any[] = []
      
      // Create map of categories
      categories.forEach(cat => {
        categoryMap[cat.id] = { ...cat, children: [] }
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
      throw createError(`Failed to fetch category tree: ${error.message}`, 500, 'CATEGORY_TREE_ERROR')
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
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      
      // Invalidate cache
      await cacheService.delPattern(CACHE_PATTERNS.CATEGORIES)
      
      return {
        success: true,
        message: 'Category created successfully',
        data
      }
    } catch (error) {
      if (error.statusCode) throw error
      throw createError(`Failed to create category: ${error.message}`, 500, 'CATEGORY_CREATE_ERROR')
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
        .single()
      
      if (fetchError || !existingCategory) {
        throw createError('Category not found', 404, 'CATEGORY_NOT_FOUND')
      }
      
      const updates: any = { ...categoryData, updated_at: new Date().toISOString(), updated_by: userId }
      
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
      
      const { data, error } = await supabase()
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      // Invalidate cache
      await cacheService.delPattern(CACHE_PATTERNS.CATEGORIES)
      
      return {
        success: true,
        message: 'Category updated successfully',
        data
      }
    } catch (error) {
      if (error.statusCode) throw error
      throw createError(`Failed to update category: ${error.message}`, 500, 'CATEGORY_UPDATE_ERROR')
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
        .single()
      
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
      const { data, error } = await supabase()
        .from('categories')
        .update({ 
          is_active: false, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      // Invalidate cache
      await cacheService.delPattern(CACHE_PATTERNS.CATEGORIES)
      
      return {
        success: true,
        message: 'Category deleted successfully',
        data
      }
    } catch (error) {
      if (error.statusCode) throw error
      throw createError(`Failed to delete category: ${error.message}`, 500, 'CATEGORY_DELETE_ERROR')
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

      if (error) throw error
      
      return {
        success: true,
        data: data || [],
        count: (data || []).length
      }
    } catch (error) {
      throw createError(`Failed to fetch all categories: ${error.message}`, 500, 'ALL_CATEGORIES_ERROR')
    }
  }
}

export default new CategoryService()
