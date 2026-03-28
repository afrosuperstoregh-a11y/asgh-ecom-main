import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { validateTokenFormat } from '@/lib/auth';

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

// POST - Upload file to Supabase Storage
export async function POST(request: NextRequest) {
  try {
    console.log('[DEBUG] === UPLOAD API ROUTE CALLED ===');
    
    // Validate admin token
    const validation = validateAdminToken(request);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - Invalid admin token'
      }, { status: 401 });
    }
    
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;
    const pathPrefix = formData.get('pathPrefix') as string;
    
    // Validate required fields
    if (!file) {
      return NextResponse.json({
        success: false,
        message: 'No file provided'
      }, { status: 400 });
    }
    
    if (!bucket) {
      return NextResponse.json({
        success: false,
        message: 'Bucket name is required'
      }, { status: 400 });
    }
    
    // Initialize Supabase client with SERVICE ROLE KEY (server-side only)
    const supabaseClient = getSupabaseServer();
    
    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    const fileName = `${timestamp}-${randomString}.${fileExt}`;
    const filePath = pathPrefix ? `${pathPrefix}/${fileName}` : fileName;
    
    console.log('[DEBUG] Uploading file:', { bucket, filePath, fileSize: file.size });
    
    // Upload file to Supabase Storage
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('[DEBUG] Upload error:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to upload file: ' + error.message
      }, { status: 500 });
    }
    
    // Get public URL
    const { data: publicUrlData } = supabaseClient.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    console.log('[DEBUG] File uploaded successfully:', publicUrlData.publicUrl);
    
    return NextResponse.json({
      success: true,
      data: {
        path: filePath,
        publicUrl: publicUrlData.publicUrl,
        fileName: file.name,
        size: file.size
      },
      message: 'File uploaded successfully'
    });
    
  } catch (error) {
    console.error('[DEBUG] Upload API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to upload file: ' + (error as Error)?.message
    }, { status: 500 });
  }
}
