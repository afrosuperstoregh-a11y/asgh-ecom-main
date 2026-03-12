import { useState, useEffect, useCallback } from 'react'
import apiClient from '@/lib/api-client'

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
        // Try API first
        result = await apiClient.getProducts(params)
      } catch (apiError) {
        console.warn('API failed, trying direct Supabase:', apiError)
        try {
          result = await apiClient.getProductsFromSupabase(params)
        } catch (supabaseError) {
          console.warn('Supabase also failed:', supabaseError)
          throw new Error('Both API and Supabase failed to fetch products')
        }
      }

      if (result && (result.success || result.data)) {
        if (result.data?.products) {
          setProducts(result.data.products)
          setPagination(result.data.pagination)
        } else {
          setProducts(Array.isArray(result.data) ? result.data : [])
        }
      } else {
        throw new Error(result?.error || 'Failed to fetch products')
      }
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
      
      // Fallback to mock data for development
      if (process.env.NODE_ENV === 'development') {
        const mockProducts = [
          {
            id: '1',
            name: 'Premium African Headwrap',
            price: 29.99,
            compare_price: 39.99,
            image: 'https://images.unsplash.com/photo-1572564203219-8d5e4b3bb5f?w=800',
            category: { name: 'Fashion', slug: 'fashion' },
            inventory_quantity: 15,
            allow_backorder: true,
            featured: true,
            rating: 4.5,
            reviews: 128
          },
          {
            id: '2', 
            name: 'Handcrafted Leather Bag',
            price: 89.99,
            image: 'https://images.unsplash.com/photo-1553062407-98eeb64b631?w=800',
            category: { name: 'Accessories', slug: 'accessories' },
            inventory_quantity: 8,
            allow_backorder: false,
            featured: true,
            rating: 4.8,
            reviews: 89
          }
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

  // Set up real-time subscriptions
  useEffect(() => {
    if (!products.length) return

    const subscription = apiClient.subscribeToProducts((payload: any) => {
      console.log('Product update:', payload)
      
      if (payload.eventType === 'INSERT') {
        setProducts((prev: any[]) => [...prev, payload.new])
      } else if (payload.eventType === 'UPDATE') {
        setProducts((prev: any[]) => 
          prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p)
        )
      } else if (payload.eventType === 'DELETE') {
        setProducts((prev: any[]) => prev.filter(p => p.id !== payload.old.id))
      }
    })

    return () => {
      subscription?.unsubscribe?.()
    }
  }, [products.length])

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
        // Try API first
        result = await apiClient.getCategories()
      } catch (apiError) {
        console.warn('API failed, trying direct Supabase:', apiError)
        try {
          result = await apiClient.getCategoriesFromSupabase()
        } catch (supabaseError) {
          console.warn('Supabase also failed:', supabaseError)
          throw new Error('Both API and Supabase failed to fetch categories')
        }
      }

      if (result && (result.success || result.data)) {
        setCategories(Array.isArray(result.data) ? result.data : result.data.categories || [])
      } else {
        throw new Error(result?.error || 'Failed to fetch categories')
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

  // Set up real-time subscriptions for categories
  useEffect(() => {
    if (!categories.length) return

    const subscription = apiClient.subscribeToCategories((payload: any) => {
      console.log('Category update:', payload)
      
      if (payload.eventType === 'INSERT') {
        setCategories((prev: any[]) => [...prev, payload.new])
      } else if (payload.eventType === 'UPDATE') {
        setCategories((prev: any[]) => 
          prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c)
        )
      } else if (payload.eventType === 'DELETE') {
        setCategories((prev: any[]) => prev.filter(c => c.id !== payload.old.id))
      }
    })

    return () => {
      subscription?.unsubscribe?.()
    }
  }, [categories.length])

  return { categories, loading, error, refetch: fetchCategories }
}

// Custom hook for fetching a single product
export function useProduct(id: string | number) {
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Try API first, fallback to direct Supabase
      let result
      
      try {
        // Try API first
        result = await apiClient.getProductById(id)
      } catch (apiError) {
        console.warn('API failed:', apiError)
        throw new Error('Failed to fetch product')
      }

      if (result && (result.success || result.data)) {
        setProduct(result.data)
      } else {
        throw new Error(result?.error || 'Failed to fetch product')
      }
    } catch (err) {
      console.error('Error fetching product:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch product')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      fetchProduct()
    }
  }, [fetchProduct])

  return { product, loading, error, refetch: fetchProduct }
}
