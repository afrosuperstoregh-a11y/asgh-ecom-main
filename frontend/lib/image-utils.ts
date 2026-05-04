/**
 * Centralized image handling utility for consistent product image processing
 */

export const FALLBACK_IMAGE = '/placeholder-product.jpg';

/**
 * Get product image URL with proper Supabase URL formatting and fallback
 * @param image - Image path or URL string
 * @param fallback - Fallback image URL (defaults to placeholder)
 * @returns Properly formatted image URL
 */
export function getProductImageUrl(image: string | undefined | null, fallback: string = FALLBACK_IMAGE): string {
  if (!image || typeof image !== 'string') {
    return fallback;
  }

  // If it's already a full URL, return as-is
  if (image.startsWith('http')) {
    return image;
  }

  // If it's a Supabase storage path, construct full URL
  if (image.startsWith('/') || !image.includes('://')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    // Debug logging
    if (typeof window !== 'undefined') {
      console.log('getProductImageUrl - supabaseUrl:', supabaseUrl);
      console.log('getProductImageUrl - input image:', image);
    }
    
    if (supabaseUrl) {
      // Remove leading slash if present
      let cleanPath = image.startsWith('/') ? image.slice(1) : image;
      
      // Check if it's already a full storage path
      if (cleanPath.includes('storage/v1/object/public/')) {
        return image.startsWith('/') ? `${supabaseUrl}${image}` : `${supabaseUrl}/${image}`;
      }
      
      // Construct storage URL for product images with proper encoding
      if (cleanPath.includes('product-images/') || cleanPath.includes('&')) {
        const encodedPath = cleanPath.split('/').map(encodeURIComponent).join('/');
        return `${supabaseUrl}/storage/v1/object/public/product-images/${encodedPath}`;
      }
      
      // Default storage path with proper encoding
      const encodedPath = cleanPath.split('/').map(encodeURIComponent).join('/');
      return `${supabaseUrl}/storage/v1/object/public/product-images/${encodedPath}`;
    } else {
      // Fallback when environment variable is not available
      console.warn('NEXT_PUBLIC_SUPABASE_URL is not available, returning fallback image');
      return fallback;
    }
  }

  return image;
}

/**
 * Get the first available image from an array of images
 * @param images - Array of image URLs or paths
 * @param fallback - Fallback image URL
 * @returns First valid image URL or fallback
 */
export function getFirstAvailableImage(images: string[] | undefined | null, fallback: string = FALLBACK_IMAGE): string {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return fallback;
  }

  // Return the first valid image
  for (const image of images) {
    if (image && typeof image === 'string') {
      return getProductImageUrl(image);
    }
  }

  return fallback;
}

/**
 * Process product images array to ensure all URLs are properly formatted
 * @param images - Array of image URLs or paths
 * @returns Processed array of properly formatted image URLs
 */
export function processProductImages(images: string[] | undefined | null): string[] {
  if (!images || !Array.isArray(images)) {
    return [FALLBACK_IMAGE];
  }

  const processedImages = images
    .filter(img => img && typeof img === 'string')
    .map(img => getProductImageUrl(img))
    .filter(url => url !== FALLBACK_IMAGE); // Remove fallbacks from main array

  // Ensure at least one image
  return processedImages.length > 0 ? processedImages : [FALLBACK_IMAGE];
}

/**
 * Generate responsive image sizes for Next.js Image component
 * @param maxSize - Maximum size of the image
 * @returns Responsive sizes string
 */
export function getResponsiveImageSizes(maxSize: string = '275px'): string {
  return maxSize;
}

/**
 * Determine appropriate loading strategy for images
 * @param priority - Whether this image should be loaded eagerly
 * @returns Loading strategy for Next.js Image component
 */
export function getImageLoadingStrategy(priority: boolean = false): 'eager' | 'lazy' {
  return priority ? 'eager' : 'lazy';
}

/**
 * Common image props for product images
 */
export const PRODUCT_IMAGE_PROPS = {
  sizes: getResponsiveImageSizes('275px'),
  loading: getImageLoadingStrategy(false),
  quality: 85,
  placeholder: 'blur' as const,
  blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
};

/**
 * Default image error handler
 */
export function handleImageError(event: React.SyntheticEvent<HTMLImageElement>) {
  // Set fallback image on error
  event.currentTarget.src = FALLBACK_IMAGE;
}
