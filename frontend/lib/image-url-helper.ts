/**
 * Centralized Image URL Helper
 * Provides consistent image URL generation across the application
 */

const FALLBACK_PRODUCT_IMAGE = '/placeholder-product.svg';
const FALLBACK_CATEGORY_IMAGE = '/placeholder-category.svg';
const FALLBACK_AVATAR_IMAGE = '/placeholder-avatar.svg';

/**
 * Gets the Supabase URL from environment variables
 */
function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || '';
}

/**
 * Normalizes image path by removing prefixes and cleaning slashes
 */
function normalizeImagePath(imagePath: string | null | undefined): string {
  if (!imagePath) return '';
  
  let cleanPath = imagePath.trim();
  
  // Remove leading slash
  if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.slice(1);
  }
  
  // Remove bucket prefixes if they exist
  const bucketPrefixes = ['product-images/', 'category-images/', 'categories/', 'avatars/', 'products/'];
  bucketPrefixes.forEach(prefix => {
    if (cleanPath.startsWith(prefix)) {
      cleanPath = cleanPath.slice(prefix.length);
    }
  });
  
  // Remove storage path prefix if it exists
  if (cleanPath.includes('storage/v1/object/public/')) {
    cleanPath = cleanPath.split('storage/v1/object/public/').pop() || cleanPath;
  }
  
  return cleanPath;
}

/**
 * Encodes path components for URL safety while preserving special characters
 */
function encodePathComponents(path: string): string {
  return path.split('/').map(segment => {
    return encodeURIComponent(segment)
      .replace(/%26/g, '&')  // Preserve &
      .replace(/%2F/g, '/'); // Preserve /
  }).join('/');
}

/**
 * Constructs a full Supabase Storage public URL
 */
function constructSupabaseUrl(bucket: string, path: string | null | undefined): string {
  const supabaseUrl = getSupabaseUrl();
  
  if (!supabaseUrl) {
    console.warn('NEXT_PUBLIC_SUPABASE_URL is not available');
    return FALLBACK_PRODUCT_IMAGE;
  }
  
  const normalizedPath = normalizeImagePath(path);
  const encodedPath = encodePathComponents(normalizedPath);
  
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodedPath}`;
}

/**
 * Gets a product image URL
 */
export function getProductImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath || typeof imagePath !== 'string') {
    return FALLBACK_PRODUCT_IMAGE;
  }
  
  // If it's already a full HTTP/HTTPS URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it's already a full Supabase storage URL, return as-is
  if (imagePath.includes('storage/v1/object/public/')) {
    return imagePath;
  }
  
  // Construct full Supabase URL for product-images bucket
  return constructSupabaseUrl('product-images', imagePath);
}

/**
 * Gets a category image URL
 */
export function getCategoryImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath || typeof imagePath !== 'string') {
    return FALLBACK_CATEGORY_IMAGE;
  }
  
  // If it's already a full HTTP/HTTPS URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it's already a full Supabase storage URL, return as-is
  if (imagePath.includes('storage/v1/object/public/')) {
    return imagePath;
  }
  
  // Construct full Supabase URL for category-images bucket
  return constructSupabaseUrl('category-images', imagePath);
}

/**
 * Gets an avatar image URL
 */
export function getAvatarImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath || typeof imagePath !== 'string') {
    return FALLBACK_AVATAR_IMAGE;
  }
  
  // If it's already a full HTTP/HTTPS URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it's already a full Supabase storage URL, return as-is
  if (imagePath.includes('storage/v1/object/public/')) {
    return imagePath;
  }
  
  // Construct full Supabase URL for avatars bucket
  return constructSupabaseUrl('avatars', imagePath);
}

/**
 * Processes an array of image paths and returns formatted URLs
 */
export function processImageUrls(imagePaths: (string | null | undefined)[] | null | undefined, bucket: string = 'product-images'): string[] {
  if (!imagePaths || !Array.isArray(imagePaths) || imagePaths.length === 0) {
    return [bucket === 'product-images' ? FALLBACK_PRODUCT_IMAGE : FALLBACK_CATEGORY_IMAGE];
  }
  
  const processedUrls = imagePaths
    .filter(path => path && typeof path === 'string')
    .map(path => constructSupabaseUrl(bucket, path))
    .filter(url => url !== FALLBACK_PRODUCT_IMAGE && url !== FALLBACK_CATEGORY_IMAGE);
  
  // Ensure at least one image
  const fallback = bucket === 'product-images' ? FALLBACK_PRODUCT_IMAGE : FALLBACK_CATEGORY_IMAGE;
  return processedUrls.length > 0 ? processedUrls : [fallback];
}

/**
 * Normalizes image extension from .png to .jpg for compatibility
 */
export function normalizeImageExtension(imagePath: string): string {
  if (imagePath.endsWith('.png')) {
    return imagePath.replace(/\.png$/, '.jpg');
  }
  return imagePath;
}
