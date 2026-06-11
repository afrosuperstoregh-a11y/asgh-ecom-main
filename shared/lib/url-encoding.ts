/**
 * Shared URL Encoding Utility
 * Provides consistent URL encoding across the application to prevent regressions
 * 
 * CRITICAL: This utility must preserve proper URL encoding for special characters
 * especially ampersands (&) which must remain as %26 to prevent HTTP 400 errors
 */

/**
 * Encodes a path component for URL safety
 * Preserves path separators (/) but encodes all other special characters
 * 
 * @param segment - A single path segment to encode
 * @returns URL-encoded segment with preserved path separator
 * 
 * @example
 * encodePathComponent('food&beverages') // 'food%26beverages'
 * encodePathComponent('beauty&health') // 'beauty%26health'
 * encodePathComponent('books&media') // 'books%26media'
 */
export function encodePathComponent(segment: string): string {
  return encodeURIComponent(segment)
    .replace(/%2F/g, '/'); // Preserve / (path separator)
    // CRITICAL: Do NOT decode %26 back to & - this causes 400 errors
    // CRITICAL: Do NOT decode %5B back to [ or %5D back to ] - these cause 400 errors
}

/**
 * Encodes all path components in a path
 * 
 * @param path - Full path with segments separated by /
 * @returns Fully encoded path with preserved separators
 * 
 * @example
 * encodePathComponents('food&beverages/banku-mix.png') 
 * // 'food%26beverages/banku-mix.png'
 */
export function encodePathComponents(path: string): string {
  return path.split('/').map(encodePathComponent).join('/');
}

/**
 * Normalizes an image path by removing common prefixes
 * 
 * @param path - Raw image path
 * @returns Cleaned path without prefixes
 */
export function normalizeImagePath(path: string): string {
  let cleanPath = path.trim();
  
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
 * Validates if a URL has properly encoded special characters
 * 
 * @param url - URL to validate
 * @returns true if URL is properly encoded, false otherwise
 */
export function isUrlProperlyEncoded(url: string): boolean {
  // Check for unencoded special characters that should be encoded
  const problematicPatterns = [
    /[&]/, // Unencoded ampersand
    /[#]/, // Unencoded hash (unless it's a fragment)
    /[?]/, // Unencoded question mark (unless it's a query param)
    /\s/,  // Unencoded space
  ];
  
  // Extract path portion (before query string or fragment)
  const pathOnly = url.split(/[?#]/)[0];
  
  // Check for problematic patterns in the path
  for (const pattern of problematicPatterns) {
    if (pattern.test(pathOnly)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Detects if a URL has double-encoded characters
 * 
 * @param url - URL to check
 * @returns true if URL has double encoding, false otherwise
 */
export function hasDoubleEncoding(url: string): boolean {
  // Check for patterns like %2526 (double-encoded %26)
  return /%25[0-9A-F]{2}/.test(url);
}

/**
 * Safely decodes a URL (handles double encoding)
 * 
 * @param url - URL to decode
 * @returns Decoded URL
 */
export function safeDecodeUrl(url: string): string {
  let decoded = url;
  let prevDecoded;
  
  // Keep decoding until no more changes (handles double/triple encoding)
  do {
    prevDecoded = decoded;
    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      break; // Invalid encoding, return as-is
    }
  } while (decoded !== prevDecoded);
  
  return decoded;
}
