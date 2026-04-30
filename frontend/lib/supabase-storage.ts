import { supabase } from './supabase-client'
import { tokenManager } from './token-manager'

/**
 * Compresses an image file before upload
 * @param file - The image file to compress
 * @param maxSize - Maximum size in KB (default: 1000KB = 1MB)
 * @param quality - Quality 0-1 (default: 0.8)
 * @returns Compressed file
 */
export async function compressImage(file: File, maxSize: number = 1000, quality: number = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      const maxDimension = 1920; // Max width/height
      
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        file.type,
        quality
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Validates file before upload
 * @param file - File to validate
 * @param maxSize - Maximum size in bytes (default: 10MB)
 * @returns Validation result
 */
export function validateFile(file: File, maxSize: number = 10 * 1024 * 1024): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`
    };
  }
  
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    };
  }
  
  return { valid: true };
}

/**
 * Safe JSON parsing with error handling
 * @param response - Fetch response object
 * @returns Parsed JSON or error
 */
async function safeJsonParse(response: Response): Promise<any> {
  try {
    const text = await response.text();
    
    // Check if response is empty
    if (!text.trim()) {
      throw new Error('Empty response from server');
    }
    
    // Try to parse as JSON
    try {
      return JSON.parse(text);
    } catch (parseError) {
      // If JSON parsing fails, check if it's an HTML error page
      if (text.includes('<!DOCTYPE') || text.includes('<html>')) {
        throw new Error('Server returned HTML instead of JSON. This may indicate a server error.');
      }
      
      // Return the raw text if it's not JSON
      throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`);
    }
  } catch (error) {
    console.error('Response parsing error:', error);
    throw error;
  }
}

/**
 * Gets the public URL for a file in Supabase Storage
 * @param bucket - The bucket name (e.g., 'products', 'categories')
 * @param path - The file path within the bucket
 * @returns The public URL for the file
 */
export async function getPublicImageUrl(bucket: string, path: string): Promise<string> {
  const supabaseClient = supabase()
  
  if (!supabaseClient) {
    console.warn('Supabase client not initialized, returning fallback URL')
    return `/placeholder-${bucket}.svg`
  }

  if (!path || typeof path !== 'string' || path.trim() === '') {
    return `/placeholder-${bucket}.svg`
  }

  try {
    const { data } = supabaseClient.storage
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
  if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
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
 * @param imagePath - The image path within the 'product-images' bucket
 * @returns The public URL for the product image
 */
export async function getProductImageUrl(imagePath?: string): Promise<string> {
  return getPublicImageUrl('product-images', imagePath || '')
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
  const supabaseClient = supabase()
  
  if (!supabaseClient) {
    console.warn('Supabase client not initialized, returning fallback URL')
    return `/placeholder-${bucket}.svg`
  }

  if (!path || typeof path !== 'string' || path.trim() === '') {
    return `/placeholder-${bucket}.svg`
  }

  try {
    const { data, error } = await supabaseClient.storage
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
 * Uploads a file to Supabase Storage using secure API route (server-side) with enhanced error handling
 * @param bucket - The bucket name (e.g., 'product-images', 'categories')
 * @param file - The file to upload
 * @param path - Optional custom path within the bucket (if not provided, generates unique path)
 * @param compress - Whether to compress the image before upload (default: true)
 * @returns The public URL of the uploaded file
 */
export async function uploadFileAdmin(bucket: string, file: File, path?: string, compress: boolean = true): Promise<string> {
  if (!file) {
    throw new Error('No file provided')
  }

  try {
    // Validate file before upload
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Compress image if enabled and it's an image file
    let processedFile = file;
    if (compress && file.type.startsWith('image/')) {
      try {
        processedFile = await compressImage(file);
        console.log('Image compressed:', { original: file.size, compressed: processedFile.size });
      } catch (compressError) {
        console.warn('Image compression failed, using original file:', compressError);
        // Continue with original file if compression fails
      }
    }

    // Get admin token for authentication using centralized token manager
    const token = tokenManager.getToken();
    
    if (!token) {
      throw new Error('No authentication token found')
    }

    // Create form data for the API request
    const formData = new FormData();
    formData.append('file', processedFile);
    formData.append('bucket', bucket);
    if (path) {
      formData.append('pathPrefix', path);
    }

    // Call secure upload API route
    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    // Use safe JSON parsing
    const result = await safeJsonParse(response);

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to upload file');
    }

    return result.data.publicUrl;
  } catch (error) {
    console.error(`Error uploading file to ${bucket} (via API):`, error);
    throw error;
  }
}

/**
 * Uploads multiple files to Supabase Storage using secure API route (server-side) with enhanced error handling
 * @param bucket - The bucket name (e.g., 'product-images', 'categories')
 * @param files - Array of files to upload
 * @param pathPrefix - Optional prefix for file paths (e.g., 'product-123')
 * @param compress - Whether to compress images before upload (default: true)
 * @returns Array of public URLs of the uploaded files
 */
export async function uploadFilesAdmin(bucket: string, files: File[], pathPrefix?: string, compress: boolean = true): Promise<string[]> {
  if (!files || files.length === 0) {
    return []
  }

  // Validate all files before starting upload
  for (const file of files) {
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(`File "${file.name}" validation failed: ${validation.error}`);
    }
  }

  const uploadPromises = files.map(async (file, index) => {
    const path = pathPrefix ? `${pathPrefix}/${file.name}` : undefined
    return uploadFileAdmin(bucket, file, path, compress)
  })

  try {
    const urls = await Promise.all(uploadPromises)
    return urls
  } catch (error) {
    console.error('Error uploading files (via API):', error)
    throw error
  }
}

/**
 * Uploads a file to Supabase Storage
 * @param bucket - The bucket name (e.g., 'products', 'categories')
 * @param file - The file to upload
 * @param path - Optional custom path within the bucket (if not provided, generates unique path)
 * @returns The public URL of the uploaded file
 */
export async function uploadFile(bucket: string, file: File, path?: string): Promise<string> {
  const supabaseClient = supabase()
  
  if (!supabaseClient) {
    throw new Error('Supabase client not initialized')
  }

  if (!file) {
    throw new Error('No file provided')
  }

  try {
    // Generate unique file path if not provided
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = path || fileName  // Don't add bucket prefix here, bucket is specified separately

    // Upload file
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error(`Error uploading file to ${bucket}/${filePath}:`, error)
      throw error
    }

    // Get public URL
    const { data: publicUrlData } = supabaseClient.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return publicUrlData.publicUrl
  } catch (error) {
    console.error(`Error uploading file to ${bucket}:`, error)
    throw error
  }
}

/**
 * Uploads multiple files to Supabase Storage
 * @param bucket - The bucket name (e.g., 'products', 'categories')
 * @param files - Array of files to upload
 * @param pathPrefix - Optional prefix for file paths (e.g., 'product-123')
 * @returns Array of public URLs of the uploaded files
 */
export async function uploadFiles(bucket: string, files: File[], pathPrefix?: string): Promise<string[]> {
  if (!files || files.length === 0) {
    return []
  }

  const uploadPromises = files.map(async (file, index) => {
    const path = pathPrefix ? `${pathPrefix}/${file.name}` : undefined
    return uploadFile(bucket, file, path)
  })

  try {
    const urls = await Promise.all(uploadPromises)
    return urls
  } catch (error) {
    console.error('Error uploading files:', error)
    throw error
  }
}

/**
 * Checks if a file exists in the bucket
 * @param bucket - The bucket name
 * @param path - The file path within the bucket
 * @returns True if the file exists, false otherwise
 */
export async function fileExists(bucket: string, path: string): Promise<boolean> {
  const supabaseClient = supabase()
  
  if (!supabaseClient || !path || typeof path !== 'string' || path.trim() === '') {
    return false
  }

  try {
    const { data, error } = await supabaseClient.storage
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
