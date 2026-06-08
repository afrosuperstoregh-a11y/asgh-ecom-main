/**
 * Signed URL API Route for Direct Supabase Uploads
 * Provides secure signed URLs for direct client-to-supabase uploads
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { validateTokenFormat } from '@/lib/auth';

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

// POST - Generate signed URL for direct upload
export async function POST(request: NextRequest) {
  try {
    console.log('[DEBUG] === SIGNED URL API ROUTE CALLED ===');
    
    // Validate admin token
    const validation = validateAdminToken(request);
    if (!validation.valid) {
      return createJsonResponse({
        success: false,
        message: 'Unauthorized - Invalid admin token'
      }, 401);
    }
    
    // Parse request body
    const body = await request.json();
    const { bucket, filePath, contentType } = body;
    
    // Validate required fields
    if (!bucket || !filePath || !contentType) {
      return createJsonResponse({
        success: false,
        message: 'Missing required fields: bucket, filePath, contentType'
      }, 400);
    }
    
    // Validate bucket name
    const allowedBuckets = ['product-images', 'categories', 'temp-uploads'];
    if (!allowedBuckets.includes(bucket)) {
      return createJsonResponse({
        success: false,
        message: `Invalid bucket. Allowed buckets: ${allowedBuckets.join(', ')}`
      }, 400);
    }
    
    // Validate content type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(contentType)) {
      return createJsonResponse({
        success: false,
        message: `Invalid content type. Allowed types: ${allowedTypes.join(', ')}`
      }, 400);
    }
    
    // Initialize Supabase client
    const supabaseClient = await getSupabaseServer();
    
    console.log('[DEBUG] Generating signed URL:', { bucket, filePath, contentType });
    
    // Generate signed URL for upload (valid for 10 minutes)
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .createSignedUrl(filePath, 600); // 10 minutes
    
    if (error) {
      console.error('[DEBUG] Signed URL generation error:', error);
      return createJsonResponse({
        success: false,
        message: 'Failed to generate signed URL: ' + error.message
      }, 500);
    }
    
    // Get public URL for the file
    const { data: publicUrlData } = supabaseClient.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    console.log('[DEBUG] Signed URL generated successfully');
    
    return createJsonResponse({
      success: true,
      data: {
        signedUrl: data.signedUrl,
        publicUrl: publicUrlData.publicUrl,
        bucket,
        filePath,
        expiresIn: 600
      },
      message: 'Signed URL generated successfully'
    });
    
  } catch (error) {
    console.error('[DEBUG] Signed URL API error:', error);
    return createJsonResponse({
      success: false,
      message: 'Failed to generate signed URL: ' + (error as Error)?.message || 'Unknown error'
    }, 500);
  }
}
