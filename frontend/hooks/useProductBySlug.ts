import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'
import { Product } from '@/types/product'

// Unified hook for fetching a single product by slug
export function useProductBySlug(slug: string) {
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
          categories!inner(id, name, slug),
          category!left(id, name, slug)
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

      console.log('useProductBySlug - Fetched product:', data)
      setProduct(data)
    } catch (err: any) {
      console.error('Error fetching product from Supabase:', err)
      setError(err.message || 'Failed to fetch product')
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
