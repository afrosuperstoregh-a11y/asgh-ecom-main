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

// GET - Fetch single product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log(' [DEBUG] === SINGLE PRODUCT API ROUTE CALLED ===');
  
  try {
    // Await params to get the ID
    const resolvedParams = await params;
    console.log(' [DEBUG] Product ID from params:', resolvedParams.id);
    
    // Validate admin token
    const validation = validateAdminToken(request);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - Invalid admin token'
      }, { status: 401 });
    }
    
    console.log(' [DEBUG] Admin authenticated:', validation.user?.email);
    
    // Validate and parse product ID
    const productId = parseInt(resolvedParams.id);
    console.log(' [DEBUG] Parsed product ID:', productId);
    
    if (!productId || isNaN(productId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid product ID'
      }, { status: 400 });
    }
    
    // Initialize Supabase client with SERVICE ROLE KEY for admin operations
    console.log(' [DEBUG] Initializing Supabase client...');
    const supabaseClient = getSupabaseServer();
    
    console.log(' [DEBUG] Supabase client initialized:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });

    // Fetch single product with ALL relational information
    console.log(' [DEBUG] Fetching product from database...');
    const { data: product, error } = await supabaseClient
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        categories!left(id, name, slug)
      `)
      .eq('id', productId)
      .maybeSingle(); // Use maybeSingle() to handle not found gracefully

    if (error) {
      console.error(' [DEBUG] Database error:', error);
      return NextResponse.json({
        success: false,
        message: 'Database error: ' + error.message
      }, { status: 500 });
    }

    if (!product) {
      console.log(' [DEBUG] Product not found for ID:', productId);
      return NextResponse.json({
        success: false,
        message: 'Product not found'
      }, { status: 404 });
    }

    console.log(' [DEBUG] Product fetched successfully:', product.id);

    // Transform the data to match the expected format with defensive guards
    const transformedProduct = {
      id: product.id,
      name: product.name || 'Unnamed Product',
      sku: product.sku || '',
      price: product.price || 0,
      description: product.description || '',
      status: product.status || 'DRAFT',
      featured: product.featured || false,
      stock: product.inventory_quantity || 0,
      category: product.category || { id: '', name: 'Uncategorized', slug: '' },
      categories: product.categories || { id: '', name: 'Uncategorized', slug: '' },
      category_id: product.category_id,
      images: Array.isArray(product.images) ? product.images : [],
      slug: product.slug || '',
      createdAt: product.created_at,
      updatedAt: product.updated_at,
      _count: {
        orderItems: 0 // Default to 0 since we can't access order_items
      }
    };

    return NextResponse.json({
      success: true,
      data: transformedProduct,
      message: 'Product retrieved successfully'
    });

  } catch (error) {
    console.error('🔍 [DEBUG] Single product API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch product: ' + (error as Error)?.message
    }, { status: 500 });
  }
}

// PUT - Update single product by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log(' [DEBUG] === UPDATE SINGLE PRODUCT API ROUTE CALLED ===');
  
  try {
    // Await params to get the ID
    const resolvedParams = await params;
    console.log(' [DEBUG] Product ID from params:', resolvedParams.id);
    
    // Validate admin token
    const validation = validateAdminToken(request);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - Invalid admin token'
      }, { status: 401 });
    }
    
    // Validate and parse product ID
    const productId = parseInt(resolvedParams.id);
    
    if (!productId || isNaN(productId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid product ID'
      }, { status: 400 });
    }
    
    // Parse request body
    const body = await request.json();
    const { name, sku, price, description, category_id, inventory_quantity, status, featured, images } = body;
    
    // Initialize Supabase client with SERVICE ROLE KEY for admin operations
    const supabaseClient = getSupabaseServer();
    
    // Update product
    const { data, error } = await supabaseClient
      .from('products')
      .update({
        name,
        sku,
        price: parseFloat(price),
        description: description || '',
        category_id: category_id || null,
        inventory_quantity: inventory_quantity || 0,
        status: status || 'draft',
        featured: featured || false,
        images: images || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()
      .maybeSingle();

    if (error) {
      console.error(' [DEBUG] Product update error:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to update product: ' + error.message
      }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({
        success: false,
        message: 'Product not found'
      }, { status: 404 });
    }
    
    console.log(' [DEBUG] Product updated successfully:', data.id);
    
    return NextResponse.json({
      success: true,
      data: data,
      message: 'Product updated successfully'
    });
    
  } catch (error) {
    console.error(' [DEBUG] Update single product API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update product: ' + (error as Error)?.message
    }, { status: 500 });
  }
}

// DELETE - Delete single product by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log(' [DEBUG] === DELETE SINGLE PRODUCT API ROUTE CALLED ===');
  
  try {
    // Await params to get the ID
    const resolvedParams = await params;
    console.log(' [DEBUG] Product ID from params:', resolvedParams.id);
    
    // Validate admin token
    const validation = validateAdminToken(request);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - Invalid admin token'
      }, { status: 401 });
    }
    
    // Validate and parse product ID
    const productId = parseInt(resolvedParams.id);
    
    if (!productId || isNaN(productId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid product ID'
      }, { status: 400 });
    }
    
    // Initialize Supabase client with SERVICE ROLE KEY for admin operations
    const supabaseClient = getSupabaseServer();
    
    // First check if product exists
    const { data: existingProduct, error: checkError } = await supabaseClient
      .from('products')
      .select('id')
      .eq('id', productId)
      .maybeSingle();

    if (checkError) {
      console.error(' [DEBUG] Product check error:', checkError);
      return NextResponse.json({
        success: false,
        message: 'Database error: ' + checkError.message
      }, { status: 500 });
    }

    if (!existingProduct) {
      return NextResponse.json({
        success: false,
        message: 'Product not found'
      }, { status: 404 });
    }
    
    // Delete product
    const { error } = await supabaseClient
      .from('products')
      .delete()
      .eq('id', productId);
    
    if (error) {
      console.error(' [DEBUG] Product deletion error:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to delete product: ' + error.message
      }, { status: 500 });
    }
    
    console.log(' [DEBUG] Product deleted successfully:', productId);
    
    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });
    
  } catch (error) {
    console.error(' [DEBUG] Delete single product API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete product: ' + (error as Error)?.message
    }, { status: 500 });
  }
}
