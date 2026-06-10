/**
 * Server-side image handling utility for Supabase Storage
 * Used in API routes and server components
 */

// Bucket names
export const BUCKETS = {
  PRODUCTS: 'product-images',
  CATEGORIES: 'categories',
  AVATARS: 'avatars',
  BANNERS: 'banners',
} as const;

// Fallback images
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
 * Constructs a full Supabase Storage public URL (server-side)
 */
export function constructSupabaseUrl(supabaseUrl: string, bucket: string, path: string): string {
  if (!supabaseUrl) {
    return FALLBACK_IMAGES.GENERIC;
  }
  
  const normalizedPath = normalizeImagePath(path);
  const encodedPath = encodePathComponents(normalizedPath);
  
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodedPath}`;
}

/**
 * Gets a product image URL with automatic bucket selection (server-side)
 */
export function getProductImageUrl(
  supabaseUrl: string,
  imagePath: string | null | undefined,
  fallback: string = FALLBACK_IMAGES.PRODUCT
): string {
  if (!isValidImagePath(imagePath)) {
    return fallback;
  }
  
  // If it's already a full HTTP/HTTPS URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it's already a full Supabase storage URL, return as-is
  if (imagePath.includes('storage/v1/object/public/')) {
    return imagePath;
  }
  
  // Construct full Supabase URL
  return constructSupabaseUrl(supabaseUrl, BUCKETS.PRODUCTS, imagePath);
}

/**
 * Gets a category image URL with automatic bucket selection (server-side)
 */
export function getCategoryImageUrl(
  supabaseUrl: string,
  imagePath: string | null | undefined,
  fallback: string = FALLBACK_IMAGES.CATEGORY
): string {
  if (!isValidImagePath(imagePath)) {
    return fallback;
  }
  
  // If it's already a full HTTP/HTTPS URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it's already a full Supabase storage URL, return as-is
  if (imagePath.includes('storage/v1/object/public/')) {
    return imagePath;
  }
  
  // Construct full Supabase URL
  return constructSupabaseUrl(supabaseUrl, BUCKETS.CATEGORIES, imagePath);
}

/**
 * Processes an array of image paths and returns formatted URLs (server-side)
 */
export function processImageUrlsServer(
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
    .map(path => constructSupabaseUrl(supabaseUrl, bucket, path))
    .filter(url => url !== fallback);
  
  // Ensure at least one image
  return processedUrls.length > 0 ? processedUrls : [fallback];
}

/**
 * Normalizes image extension from .png to .jpg for product images
 */
export function normalizeImageExtension(imagePath: string): string {
  if (imagePath.endsWith('.png')) {
    return imagePath.replace(/\.png$/, '.jpg');
  }
  return imagePath;
}
