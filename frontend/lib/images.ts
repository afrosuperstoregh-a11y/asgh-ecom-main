/**
 * Centralized Image Handling Utility for Supabase Storage
 * Provides consistent image URL generation, error handling, and fallbacks
 */

// Environment configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_PROJECT_REF = SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

// Bucket names
export const BUCKETS = {
  PRODUCTS: 'product-images',
  CATEGORIES: 'categories',
  AVATARS: 'avatars',
  BANNERS: 'banners',
} as const;

// Fallback images
export const FALLBACK_IMAGES = {
  PRODUCT: '/placeholder-product.jpg',
  CATEGORY: '/placeholder-category.svg',
  AVATAR: '/placeholder-avatar.svg',
  BANNER: '/placeholder-banner.jpg',
  GENERIC: '/placeholder-generic.jpg',
} as const;

/**
 * Validates if a string is a valid image path
 */
function isValidImagePath(path: unknown): path is string {
  return typeof path === 'string' && path.trim().length > 0;
}

/**
 * Cleans and normalizes image paths
 * Removes duplicate prefixes, leading/trailing slashes, and special characters
 */
function normalizeImagePath(path: string): string {
  let cleanPath = path.trim();
  
  // Remove leading slash
  if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.slice(1);
  }
  
  // Remove bucket prefix if it exists (to avoid duplication)
  Object.values(BUCKETS).forEach(bucket => {
    const prefix = `${bucket}/`;
    if (cleanPath.startsWith(prefix)) {
      cleanPath = cleanPath.slice(prefix.length);
    }
  });
  
  // Remove 'storage/v1/object/public/' prefix if it exists
  if (cleanPath.includes('storage/v1/object/public/')) {
    cleanPath = cleanPath.split('storage/v1/object/public/').pop() || cleanPath;
  }
  
  return cleanPath;
}

/**
 * Encodes path components for URL safety
 * Handles special characters like &, spaces, etc.
 */
function encodePathComponents(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/');
}

/**
 * Constructs a full Supabase Storage public URL
 */
function constructSupabaseUrl(bucket: string, path: string): string {
  if (!SUPABASE_URL) {
    console.warn('NEXT_PUBLIC_SUPABASE_URL is not configured');
    return FALLBACK_IMAGES.GENERIC;
  }
  
  const normalizedPath = normalizeImagePath(path);
  const encodedPath = encodePathComponents(normalizedPath);
  
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodedPath}`;
}

/**
 * Gets a public URL for a Supabase Storage image
 * @param bucket - The bucket name (use BUCKETS constants)
 * @param path - The image path within the bucket
 * @param fallback - Fallback image URL if image is invalid
 * @returns Properly formatted image URL
 */
export function getSupabaseImageUrl(
  bucket: string,
  path: string | null | undefined,
  fallback: string = FALLBACK_IMAGES.GENERIC
): string {
  // Handle null/undefined/empty paths
  if (!isValidImagePath(path)) {
    return fallback;
  }
  
  // If it's already a full HTTP/HTTPS URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // If it's already a full Supabase storage URL, return as-is
  if (path.includes('storage/v1/object/public/')) {
    return path;
  }
  
  // Construct full Supabase URL
  return constructSupabaseUrl(bucket, path);
}

/**
 * Gets a product image URL with automatic bucket selection
 * @param imagePath - The image path (can be relative or full URL)
 * @param fallback - Fallback image URL
 * @returns Properly formatted product image URL
 */
export function getProductImageUrl(
  imagePath: string | null | undefined,
  fallback: string = FALLBACK_IMAGES.PRODUCT
): string {
  return getSupabaseImageUrl(BUCKETS.PRODUCTS, imagePath, fallback);
}

/**
 * Gets a category image URL with automatic bucket selection
 * @param imagePath - The image path (can be relative or full URL)
 * @param fallback - Fallback image URL
 * @returns Properly formatted category image URL
 */
export function getCategoryImageUrl(
  imagePath: string | null | undefined,
  fallback: string = FALLBACK_IMAGES.CATEGORY
): string {
  return getSupabaseImageUrl(BUCKETS.CATEGORIES, imagePath, fallback);
}

/**
 * Gets an avatar image URL with automatic bucket selection
 * @param imagePath - The image path (can be relative or full URL)
 * @param fallback - Fallback image URL
 * @returns Properly formatted avatar image URL
 */
export function getAvatarImageUrl(
  imagePath: string | null | undefined,
  fallback: string = FALLBACK_IMAGES.AVATAR
): string {
  return getSupabaseImageUrl(BUCKETS.AVATARS, imagePath, fallback);
}

/**
 * Gets a banner image URL with automatic bucket selection
 * @param imagePath - The image path (can be relative or full URL)
 * @param fallback - Fallback image URL
 * @returns Properly formatted banner image URL
 */
export function getBannerImageUrl(
  imagePath: string | null | undefined,
  fallback: string = FALLBACK_IMAGES.BANNER
): string {
  return getSupabaseImageUrl(BUCKETS.BANNERS, imagePath, fallback);
}

/**
 * Processes an array of image paths and returns formatted URLs
 * @param bucket - The bucket name
 * @param paths - Array of image paths
 * @param fallback - Fallback image URL
 * @returns Array of properly formatted image URLs
 */
export function processImageUrls(
  bucket: string,
  paths: (string | null | undefined)[] | null | undefined,
  fallback: string = FALLBACK_IMAGES.GENERIC
): string[] {
  if (!paths || !Array.isArray(paths) || paths.length === 0) {
    return [fallback];
  }
  
  const processedUrls = paths
    .filter(path => isValidImagePath(path))
    .map(path => getSupabaseImageUrl(bucket, path, fallback))
    .filter(url => url !== fallback); // Remove fallbacks from main array
  
  // Ensure at least one image
  return processedUrls.length > 0 ? processedUrls : [fallback];
}

/**
 * Gets the first available image from an array
 * @param bucket - The bucket name
 * @param paths - Array of image paths
 * @param fallback - Fallback image URL
 * @returns First valid image URL or fallback
 */
export function getFirstAvailableImage(
  bucket: string,
  paths: (string | null | undefined)[] | null | undefined,
  fallback: string = FALLBACK_IMAGES.GENERIC
): string {
  const processedUrls = processImageUrls(bucket, paths, fallback);
  return processedUrls[0] || fallback;
}

/**
 * Legacy compatibility function - converts old image URL format
 * @deprecated Use getSupabaseImageUrl instead
 */
export function fixImageUrl(imageUrl?: string): string {
  return getProductImageUrl(imageUrl);
}

/**
 * Legacy compatibility function with fallback
 * @deprecated Use getSupabaseImageUrl with fallback parameter instead
 */
export function fixImageUrlWithFallback(imageUrl?: string): string {
  return getProductImageUrl(imageUrl);
}

/**
 * Image error handler for React img/Next.js Image components
 * Sets fallback image on error
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement>,
  fallback: string = FALLBACK_IMAGES.GENERIC
): void {
  const target = event.currentTarget;
  if (!target.src.includes(fallback)) {
    target.src = fallback;
  }
}

/**
 * Generates responsive image sizes for Next.js Image component
 * @param maxWidth - Maximum width of the image
 * @returns Responsive sizes string
 */
export function getResponsiveSizes(maxWidth: string = '275px'): string {
  return `(max-width: 768px) 100vw, (max-width: 1200px) 50vw, ${maxWidth}`;
}

/**
 * Determines loading strategy for images
 * @param priority - Whether this image should be loaded eagerly
 * @returns Loading strategy for Next.js Image component
 */
export function getImageLoading(priority: boolean = false): 'eager' | 'lazy' {
  return priority ? 'eager' : 'lazy';
}

/**
 * Common image props for Next.js Image component
 */
export const COMMON_IMAGE_PROPS = {
  quality: 85,
  loading: getImageLoading(false),
  sizes: getResponsiveSizes('275px'),
};

/**
 * Product card image props (without dimensions for use with fill)
 */
export const PRODUCT_CARD_IMAGE_PROPS = {
  ...COMMON_IMAGE_PROPS,
  sizes: getResponsiveSizes('275px'),
};

/**
 * Product detail image props
 */
export const PRODUCT_DETAIL_IMAGE_PROPS = {
  ...COMMON_IMAGE_PROPS,
  sizes: getResponsiveSizes('600px'),
  width: 600,
  height: 600,
  priority: true,
  loading: getImageLoading(true),
};

/**
 * Category card image props
 */
export const CATEGORY_CARD_IMAGE_PROPS = {
  ...COMMON_IMAGE_PROPS,
  sizes: getResponsiveSizes('300px'),
};

/**
 * Avatar image props (without dimensions for use with fill)
 */
export const AVATAR_IMAGE_PROPS = {
  ...COMMON_IMAGE_PROPS,
  sizes: getResponsiveSizes('48px'),
};

/**
 * Validates if a URL is a valid Supabase Storage URL
 */
export function isValidSupabaseUrl(url: string): boolean {
  if (!SUPABASE_URL) return false;
  return url.startsWith(SUPABASE_URL) && url.includes('storage/v1/object/public/');
}

/**
 * Extracts bucket and path from a Supabase Storage URL
 * @param url - Full Supabase Storage URL
 * @returns Object with bucket and path, or null if invalid
 */
export function extractBucketAndPath(url: string): { bucket: string; path: string } | null {
  if (!isValidSupabaseUrl(url)) {
    return null;
  }
  
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Expected format: /storage/v1/object/public/{bucket}/{path}
    const publicIndex = pathParts.indexOf('public');
    if (publicIndex === -1 || publicIndex + 2 >= pathParts.length) {
      return null;
    }
    
    const bucket = pathParts[publicIndex + 1];
    const path = pathParts.slice(publicIndex + 2).join('/');
    
    return { bucket, path };
  } catch {
    return null;
  }
}

/**
 * Logs image loading errors for debugging
 */
export function logImageError(
  context: string,
  imageUrl: string,
  error?: Error
): void {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Image Error] ${context}:`, {
      url: imageUrl,
      error: error?.message,
      timestamp: new Date().toISOString(),
    });
  }
}
