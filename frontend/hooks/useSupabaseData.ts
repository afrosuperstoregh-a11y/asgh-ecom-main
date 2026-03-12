import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import apiClient from '../lib/api-client'

// Custom hook for fetching products with caching and real-time updates
export function useProducts(params: {
  page?: number
  limit?: number
  category?: string
  search?: string
  featured?: boolean
} = {}) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<any>(null)

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Try API first, fallback to direct Supabase
      let result
      
      try {
        result = await apiClient.getProducts(params)
      } catch (apiError) {
        console.warn('API failed, trying direct Supabase:', apiError)
        result = await apiClient.getProductsFromSupabase(params)
      }

      if (result.success && result.data) {
        setProducts(result.data.products || [])
        setPagination(result.data.pagination)
      } else {
        throw new Error(result.error || 'Failed to fetch products')
      }
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
      
      // Fallback to mock data for development
      if (process.env.NODE_ENV === 'development') {
        const mockProducts = [
          { 
            id: 1, 
            name: 'Girls Dashiki', 
            price: 39.99, 
            image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/girls-dashiki.svg', 
            category: 'Women Fashion', 
            inventory_quantity: 15, 
            track_inventory: true, 
            allow_backorder: false 
          },
          { 
            id: 2, 
            name: 'Boys Dashiki', 
            price: 35.99, 
            image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/boys-dashiki.svg', 
            category: 'Men Fashion', 
            inventory_quantity: 8, 
            track_inventory: true, 
            allow_backorder: false 
          },
          { 
            id: 3, 
            name: 'Banku Flour', 
            price: 25.99, 
            image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/banku-flour.svg', 
            category: 'Food', 
            inventory_quantity: 25, 
            track_inventory: true, 
            allow_backorder: true 
          },
        ]
        setProducts(mockProducts)
      }
    } finally {
      setLoading(false)
    }
  }, [params.page, params.limit, params.category, params.search, params.featured])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Set up real-time subscription
  useEffect(() => {
    if (!supabase) return

    const subscription = apiClient.subscribeToProducts((payload) => {
      console.log('Product update:', payload)
      // Refetch products on any change
      fetchProducts()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchProducts])

  return { products, loading, error, pagination, refetch: fetchProducts }
}

// Custom hook for fetching categories with caching and real-time updates
export function useCategories() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Try API first, fallback to direct Supabase
      let result
      
      try {
        result = await apiClient.getCategories()
      } catch (apiError) {
        console.warn('API failed, trying direct Supabase:', apiError)
        result = await apiClient.getCategoriesFromSupabase()
      }

      if (result.success && result.data) {
        setCategories(Array.isArray(result.data) ? result.data : result.data.categories || [])
      } else {
        throw new Error(result.error || 'Failed to fetch categories')
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch categories')
      
      // Fallback to mock data for development
      if (process.env.NODE_ENV === 'development') {
        const mockCategories = [
          {
            id: 1,
            name: 'Women Fashion',
            slug: 'women-fashion',
            image_url: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/women-fashion.svg',
            productCount: 15
          },
          {
            id: 2,
            name: 'Men Fashion',
            slug: 'men-fashion',
            image_url: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/men-fashion.svg',
            productCount: 12
          },
          {
            id: 3,
            name: 'Food & Groceries',
            slug: 'food-groceries',
            image_url: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/food-groceries.svg',
            productCount: 8
          },
          {
            id: 4,
            name: 'Home & Living',
            slug: 'home-living',
            image_url: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/home-living.svg',
            productCount: 6
          }
        ]
        setCategories(mockCategories)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Set up real-time subscription
  useEffect(() => {
    if (!supabase) return

    const subscription = apiClient.subscribeToCategories((payload) => {
      console.log('Category update:', payload)
      // Refetch categories on any change
      fetchCategories()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchCategories])

  return { categories, loading, error, refetch: fetchCategories }
}

// Hook for single product
export function useProduct(id: string | number) {
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        setError(null)

        const result = await apiClient.getProductById(id)
        
        if (result.success && result.data) {
          setProduct(result.data)
        } else {
          throw new Error(result.error || 'Failed to fetch product')
        }
      } catch (err) {
        console.error('Error fetching product:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch product')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchProduct()
    }
  }, [id])

  return { product, loading, error }
}
