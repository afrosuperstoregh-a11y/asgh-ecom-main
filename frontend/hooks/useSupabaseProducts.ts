import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'
import { fetchAllProducts, fetchProductsWithPagination } from '@/lib/supabase-api'
import { Product } from '@/types/product'

export interface PaginationInfo {
  currentPage: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// Custom hook for fetching products from Supabase
export function useSupabaseProducts(params: {
  page?: number
  limit?: number
  category?: string
  search?: string
  minPrice?: number
  maxPrice?: number
  featured?: boolean
  status?: 'active' | 'draft' | 'archived'
} = {}) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (process.env.NODE_ENV === 'development') {
        console.log('useSupabaseProducts - Fetching with params:', params)
      }

      let result

      // Use pagination if page is specified
      if (params.page || params.limit) {
        result = await fetchProductsWithPagination(
          params.page || 1,
          params.limit || 20
        )
      } else {
        result = { products: await fetchAllProducts() }
      }

      // Filter results based on params
      let filteredProducts = result.products || []

      if (params.category) {
        filteredProducts = filteredProducts.filter(product =>
          product.category?.slug === params.category
        )
      }

      if (params.search) {
        const searchLower = params.search.toLowerCase()
        filteredProducts = filteredProducts.filter(product =>
          product.name.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower) ||
          product.short_description?.toLowerCase().includes(searchLower) ||
          product.sku.toLowerCase().includes(searchLower)
        )
      }

      if (params.minPrice !== undefined) {
        filteredProducts = filteredProducts.filter(product =>
          product.price >= params.minPrice!
        )
      }

      if (params.maxPrice !== undefined) {
        filteredProducts = filteredProducts.filter(product =>
          product.price <= params.maxPrice!
        )
      }

      if (params.featured !== undefined) {
        filteredProducts = filteredProducts.filter(product =>
          product.featured === params.featured
        )
      }

      if (params.status) {
        filteredProducts = filteredProducts.filter(product =>
          product.status === params.status
        )
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('useSupabaseProducts - Filtered products:', filteredProducts.length)
      }

      setProducts(filteredProducts)
      if (result.pagination) {
        setPagination(result.pagination)
      }
    } catch (err) {
      console.error('Error fetching products from Supabase:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [params.page, params.limit, params.category, params.search, params.minPrice, params.maxPrice, params.featured, params.status])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return { products, loading, error, pagination, refetch: fetchProducts }
}

// Custom hook for fetching a single product by slug
export function useSupabaseProduct(slug: string) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProduct = useCallback(async () => {
    if (!slug) return

    try {
      setLoading(true)
      setError(null)

      const supabase = getSupabaseClient()

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category!category_id(id, name, slug)
        `)
        .eq('slug', slug)
        .eq('status', 'active')
        .single()

      if (error) {
        console.error('Supabase error fetching product:', error)
        throw new Error(error.message)
      }

      if (!data) {
        throw new Error('Product not found')
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('useSupabaseProduct - Fetched product:', data)
      }
      setProduct(data)
    } catch (err) {
      console.error('Error fetching product from Supabase:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch product')
      setProduct(null)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    fetchProduct()
  }, [fetchProduct])

  return { product, loading, error, refetch: fetchProduct }
}

// Custom hook for fetching categories from Supabase
export function useSupabaseCategories() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = getSupabaseClient()

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) {
        console.error('Supabase error fetching categories:', error)
        throw new Error(error.message)
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('useSupabaseCategories - Fetched categories:', data?.length || 0)
      }
      setCategories(data || [])
    } catch (err) {
      console.error('Error fetching categories from Supabase:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch categories')
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return { categories, loading, error, refetch: fetchCategories }
}

// Hook for fetching featured products
export function useFeaturedProducts(limit: number = 8) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFeatured = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = getSupabaseClient()

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category!category_id(id, name, slug)
        `)
        .eq('featured', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Supabase error fetching featured products:', error)
        throw new Error(error.message)
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('useFeaturedProducts - Fetched featured products:', data?.length || 0)
      }
      setProducts(data || [])
    } catch (err) {
      console.error('Error fetching featured products from Supabase:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch featured products')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchFeatured()
  }, [fetchFeatured])

  return { products, loading, error, refetch: fetchFeatured }
}
