import { useState, useEffect, useCallback } from 'react'
import { Product } from '../types/product.js'

// Custom hook for fetching products from backend API
export function useProducts(params: {
  page?: number
  limit?: number
  category?: string
  search?: string
  featured?: boolean
} = {}) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<any>(null)

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query string
      const queryParams = new URLSearchParams()
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.category) queryParams.append('category', params.category)
      if (params.search) queryParams.append('search', params.search)
      if (params.featured !== undefined) queryParams.append('featured', params.featured.toString())

      const response = await fetch(`/api/products?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      console.log('useProducts - API Response:', result)

      if (result.success) {
        setProducts(result.data.products || [])
        setPagination(result.data.pagination)
      } else {
        throw new Error(result.message || 'Failed to fetch products')
      }
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [params.page, params.limit, params.category, params.search, params.featured])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return { products, loading, error, pagination, refetch: fetchProducts }
}

// Custom hook for fetching categories from backend API
export function useCategories() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/products/categories')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      console.log('useCategories - API Response:', result)

      if (result.success && result.data) {
        setCategories(result.data)
      } else if (result.categories) {
        // Handle different response format
        setCategories(result.categories)
      } else {
        throw new Error(result.message || 'Failed to fetch categories')
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
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

// Custom hook for fetching a single product from backend API
export function useProduct(id: string | number) {
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/products/${id}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      console.log('useProduct - API Response:', result)

      if (result.success) {
        setProduct(result.data)
      } else {
        throw new Error(result.message || 'Failed to fetch product')
      }
    } catch (err) {
      console.error('Error fetching product:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch product')
      setProduct(null)
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
