import { useState, useEffect, useCallback } from 'react'

// Custom hook for fetching categories from backend API
export function useCategories() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/categories')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      console.log('useCategories (separate file) - API Response:', result)

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
  }, []) // Empty dependency array - only run once on mount

  return { categories, loading, error, refetch: fetchCategories }
}
