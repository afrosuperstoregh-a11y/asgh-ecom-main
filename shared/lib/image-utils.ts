/**
 * Shared Image URL Construction Utility
 * This is a shared helper that can be used by both frontend and backend
 * to ensure consistent image URL generation across the application.
 */

export const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const BUCKETS = {
  PRODUCTS: 'product-images',
  CATEGORIES: 'categories',
  AVATARS: 'avatars',
  BANNERS: 'banners',
} as const;

export const FALLBACK_IMAGES = {
  PRODUCT: '/placeholder-product.svg',
  CATEGORY: '/placeholder-category.svg',
  AVATAR: '/placeholder-avatar.svg',
  BANNER: '/placeholder-category.svg',
  GENERIC: '/placeholder-product.svg',
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
 * Preserves special characters like & that are valid in Supabase Storage paths
 * BUT properly encodes [ and ] characters which cause 400 errors in Next.js Image optimization
 */
function encodePathComponents(path: string): string {
  return path.split('/').map(segment => {
    // Encode only unsafe characters, preserve & and other valid characters
    // DO NOT preserve [ and ] - they cause 400 errors in Next.js Image optimization
    return encodeURIComponent(segment)
      .replace(/%26/g, '&')  // Preserve &
      .replace(/%2F/g, '/')  // Preserve /
      .replace(/%3F/g, '?')  // Preserve ?
      .replace(/%23/g, '#'); // Preserve #
      // Removed: .replace(/%5B/g, '[') and .replace(/%5D/g, ']')
      // These characters must remain encoded to avoid 400 errors
  }).join('/');
}

/**
 * Constructs a full Supabase Storage public URL
 */
export function constructSupabaseUrl(
  supabaseUrl: string,
  bucket: string,
  path: string
): string {
  if (!supabaseUrl) {
    console.warn('[IMAGE_UTILS] SUPABASE_URL is not configured');
    return FALLBACK_IMAGES.GENERIC;
  }
  
  const normalizedPath = normalizeImagePath(path);
  const encodedPath = encodePathComponents(normalizedPath);
  
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodedPath}`;
}

/**
 * Gets a public URL for a Supabase Storage image
 * @param supabaseUrl - The Supabase URL (from env)
 * @param bucket - The bucket name (use BUCKETS constants)
 * @param path - The image path within the bucket
 * @param fallback - Fallback image URL if image is invalid
 * @returns Properly formatted image URL
 */
export function getSupabaseImageUrl(
  supabaseUrl: string,
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
  return constructSupabaseUrl(supabaseUrl, bucket, path);
}

/**
 * Gets a product image URL with automatic bucket selection
 * @param supabaseUrl - The Supabase URL (from env)
 * @param imagePath - The image path (can be relative or full URL)
 * @param fallback - Fallback image URL
 * @returns Properly formatted product image URL
 */
export function getProductImageUrl(
  supabaseUrl: string,
  imagePath: string | null | undefined,
  fallback: string = FALLBACK_IMAGES.PRODUCT
): string {
  return getSupabaseImageUrl(supabaseUrl, BUCKETS.PRODUCTS, imagePath, fallback);
}

/**
 * Processes an array of image paths and returns formatted URLs
 * @param supabaseUrl - The Supabase URL (from env)
 * @param bucket - The bucket name
 * @param paths - Array of image paths
 * @param fallback - Fallback image URL
 * @returns Array of properly formatted image URLs
 */
export function processImageUrls(
  supabaseUrl: string,
  bucket: string,
  paths: (string | null | undefined)[] | null | undefined,
  fallback: string = FALLBACK_IMAGES.GENERIC
): string[] {
  if (!paths || !Array.isArray(paths) || paths.length === 0) {
    return [fallback];
  }
  
  const processedUrls = paths
    .filter(path => isValidImagePath(path))
    .map(path => getSupabaseImageUrl(supabaseUrl, bucket, path, fallback))
    .filter(url => url !== fallback); // Remove fallbacks from main array
  
  // Ensure at least one image
  return processedUrls.length > 0 ? processedUrls : [fallback];
}

/**
 * Gets the first available image from an array
 * @param supabaseUrl - The Supabase URL (from env)
 * @param bucket - The bucket name
 * @param paths - Array of image paths
 * @param fallback - Fallback image URL
 * @returns First valid image URL or fallback
 */
export function getFirstAvailableImage(
  supabaseUrl: string,
  bucket: string,
  paths: (string | null | undefined)[] | null | undefined,
  fallback: string = FALLBACK_IMAGES.GENERIC
): string {
  const processedUrls = processImageUrls(supabaseUrl, bucket, paths, fallback);
  return processedUrls[0] || fallback;
}
