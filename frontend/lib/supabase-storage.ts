import { supabase } from './supabase-client'

/**
 * Gets the public URL for a file in Supabase Storage
 * @param bucket - The bucket name (e.g., 'products', 'categories')
 * @param path - The file path within the bucket
 * @returns The public URL for the file
 */
export async function getPublicImageUrl(bucket: string, path: string): Promise<string> {
  if (!supabase) {
    console.warn('Supabase client not initialized, returning fallback URL')
    return `/placeholder-${bucket}.svg`
  }

  if (!path || path.trim() === '') {
    return `/placeholder-${bucket}.svg`
  }

  try {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return data.publicUrl
  } catch (error) {
    console.error(`Error getting public URL for ${bucket}/${path}:`, error)
    return `/placeholder-${bucket}.svg`
  }
}

/**
 * Fixes Supabase image URLs to ensure they work with Next.js Image component
 * @param imageUrl - The image URL from the database
 * @returns The fixed image URL
 */
export function fixImageUrl(imageUrl?: string): string {
  if (!imageUrl || imageUrl.trim() === '') {
    return '/placeholder-product.jpg'
  }

  // If it's already a full Supabase URL, return it as is
  if (imageUrl.includes('supabase.co/storage/v1/object/public')) {
    return imageUrl
  }

  // If it's a relative path starting with product-images, convert to full Supabase URL
  if (imageUrl.startsWith('product-images/')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl) {
      return `${supabaseUrl}/storage/v1/object/public/${imageUrl}`
    }
  }

  // If it's just a filename, assume it's in the product-images bucket
  if (!imageUrl.includes('/') && !imageUrl.startsWith('http')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl) {
      return `${supabaseUrl}/storage/v1/object/public/product-images/${imageUrl}`
    }
  }

  // Return original URL if none of the above conditions match
  return imageUrl
}

/**
 * Gets the public URL for a product image
 * @param imagePath - The image path within the 'products' bucket
 * @returns The public URL for the product image
 */
export async function getProductImageUrl(imagePath?: string): Promise<string> {
  return getPublicImageUrl('products', imagePath || '')
}

/**
 * Gets the public URL for a category image
 * @param imagePath - The image path within the 'categories' bucket
 * @returns The public URL for the category image
 */
export async function getCategoryImageUrl(imagePath?: string): Promise<string> {
  return getPublicImageUrl('categories', imagePath || '')
}

/**
 * Processes an array of image paths and returns an array of public URLs
 * @param bucket - The bucket name
 * @param imagePaths - Array of image paths
 * @returns Array of public URLs
 */
export async function processImageUrls(bucket: string, imagePaths: string[]): Promise<string[]> {
  if (!imagePaths || !Array.isArray(imagePaths)) {
    return []
  }

  const urls = await Promise.all(
    imagePaths.map(async (path) => await getPublicImageUrl(bucket, path))
  )

  return urls.filter(url => url && !url.includes('placeholder'))
}

/**
 * Creates a signed URL for a private file
 * @param bucket - The bucket name
 * @param path - The file path within the bucket
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns The signed URL for the file
 */
export async function getSignedUrl(bucket: string, path: string, expiresIn: number = 3600): Promise<string> {
  if (!supabase) {
    console.warn('Supabase client not initialized, returning fallback URL')
    return `/placeholder-${bucket}.svg`
  }

  if (!path || path.trim() === '') {
    return `/placeholder-${bucket}.svg`
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)

    if (error) throw error

    return data.signedUrl
  } catch (error) {
    console.error(`Error creating signed URL for ${bucket}/${path}:`, error)
    return `/placeholder-${bucket}.svg`
  }
}

/**
 * Checks if a file exists in the bucket
 * @param bucket - The bucket name
 * @param path - The file path within the bucket
 * @returns True if the file exists, false otherwise
 */
export async function fileExists(bucket: string, path: string): Promise<boolean> {
  if (!supabase || !path || path.trim() === '') {
    return false
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list('', { 
        search: path.split('/').pop() || '',
        limit: 1
      })

    if (error) throw error

    return data && data.length > 0
  } catch (error) {
    console.error(`Error checking if file exists ${bucket}/${path}:`, error)
    return false
  }
}
