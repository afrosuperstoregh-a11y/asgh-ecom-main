import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { validateTokenFormat } from '@/lib/auth';

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Helper function to validate admin token
function validateAdminToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { valid: false };
    }

    const token = authHeader.substring(7);
    const isValidFormat = validateTokenFormat(token);
    
    if (isValidFormat) {
      return {
        valid: true,
        user: {
          id: 'admin-001',
          email: 'info@afrosuperstore.ca',
          name: 'Super Admin',
          role: 'super_admin'
        }
      };
    }

    return { valid: false };
  } catch (error) {
    console.error('Token validation error:', error);
    return { valid: false };
  }
}

// Helper function to create consistent JSON responses
function createJsonResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return createJsonResponse({ success: true }, 200);
}

// POST - Upload file to Supabase Storage
export async function POST(request: NextRequest) {
  try {
    console.log('[DEBUG] === UPLOAD API ROUTE CALLED ===');
    
    // Validate admin token
    const validation = validateAdminToken(request);
    if (!validation.valid) {
      return createJsonResponse({
        success: false,
        message: 'Unauthorized - Invalid admin token'
      }, 401);
    }
    
    // Check content length
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
      return createJsonResponse({
        success: false,
        message: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      }, 413);
    }
    
    // Parse form data with error handling
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      console.error('[DEBUG] FormData parsing error:', error);
      return createJsonResponse({
        success: false,
        message: 'Invalid form data or file too large'
      }, 400);
    }
    
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;
    const pathPrefix = formData.get('pathPrefix') as string;
    
    // Validate required fields
    if (!file) {
      return createJsonResponse({
        success: false,
        message: 'No file provided'
      }, 400);
    }
    
    if (!bucket) {
      return createJsonResponse({
        success: false,
        message: 'Bucket name is required'
      }, 400);
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return createJsonResponse({
        success: false,
        message: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      }, 413);
    }
    
    // Validate file type (images only)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return createJsonResponse({
        success: false,
        message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      }, 400);
    }
    
    // Initialize Supabase client with SERVICE ROLE KEY (server-side only)
    const supabaseClient = await getSupabaseServer();
    
    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    const fileName = `${timestamp}-${randomString}.${fileExt}`;
    const filePath = pathPrefix ? `${pathPrefix}/${fileName}` : fileName;
    
    console.log('[DEBUG] Uploading file:', { bucket, filePath, fileSize: file.size, fileType: file.type });
    
    // Upload file to Supabase Storage
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });
    
    if (error) {
      console.error('[DEBUG] Upload error:', error);
      return createJsonResponse({
        success: false,
        message: 'Failed to upload file: ' + error.message
      }, 500);
    }
    
    // Get public URL
    const { data: publicUrlData } = supabaseClient.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    console.log('[DEBUG] File uploaded successfully:', publicUrlData.publicUrl);
    
    return createJsonResponse({
      success: true,
      data: {
        path: filePath,
        publicUrl: publicUrlData.publicUrl,
        fileName: file.name,
        originalName: file.name,
        size: file.size,
        type: file.type
      },
      message: 'File uploaded successfully'
    });
    
  } catch (error) {
    console.error('[DEBUG] Upload API error:', error);
    
    // Handle different types of errors appropriately
    if (error instanceof Error && error.message.includes('request entity too large')) {
      return createJsonResponse({
        success: false,
        message: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      }, 413);
    }
    
    return createJsonResponse({
      success: false,
      message: 'Failed to upload file: ' + (error as Error)?.message || 'Unknown error'
    }, 500);
  }
}
