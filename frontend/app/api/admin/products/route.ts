import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateTokenFormat } from '@/lib/auth';

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

// GET - Fetch products
export async function GET(request: NextRequest) {
  
  console.log(' [DEBUG] === PRODUCTS API ROUTE CALLED ===');
  
  try {
    console.log(' [DEBUG] Products API request received');
    
    // Validate admin token
    const validation = validateAdminToken(request);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - Invalid admin token'
      }, { status: 401 });
    }
    
    console.log(' [DEBUG] Admin authenticated:', validation.user?.email);
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const featured = searchParams.get('featured') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Initialize Supabase client with SERVICE ROLE KEY for admin operations
    console.log(' [DEBUG] Initializing Supabase client...');
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    console.log(' [DEBUG] Supabase client initialized:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });

    // Build the query
    let query = supabaseClient
      .from('products')
      .select(`
        *,
        category:categories(id, name)
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq('category_id', category);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (featured) {
      query = query.eq('featured', featured === 'true');
    }

    // Apply sorting - map frontend field names to database column names
    const sortMapping: Record<string, string> = {
      'createdAt': 'created_at',
      'updatedAt': 'updated_at',
      'name': 'name',
      'price': 'price',
      'stock': 'inventory_quantity'
    };
    
    const dbSortBy = sortMapping[sortBy] || 'created_at';
    query = query.order(dbSortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    console.log(' [DEBUG] Executing Supabase query...');
    const { data: products, error, count } = await query;

    if (error) {
      console.error(' [DEBUG] Supabase query error:', error);
      throw error;
    }

    console.log(' [DEBUG] Products fetched successfully:', { count: products?.length, total: count });

    // Transform the data to match the expected format
    const transformedProducts = products?.map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      status: product.status,
      featured: product.featured,
      stock: product.inventory_quantity || 0,
      category: product.category || { id: '', name: 'Uncategorized' },
      createdAt: product.created_at,
      updatedAt: product.updated_at,
      _count: {
        orderItems: 0 // Default to 0 since we can't access order_items
      }
    })) || [];

    const pagination = {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit)
    };

    return NextResponse.json({
      success: true,
      data: {
        products: transformedProducts,
        pagination
      },
      message: 'Products retrieved successfully'
    });

  } catch (error) {
    console.error('🔍 [DEBUG] Products API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch products: ' + (error as Error)?.message
    }, { status: 500 });
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
    console.log(' [DEBUG] === CREATE PRODUCT API ROUTE CALLED ===');
    
    // Validate admin token
    const validation = validateAdminToken(request);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - Invalid admin token'
      }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    const { name, sku, price, description, category_id, inventory_quantity, status, featured, image_url } = body;
    
    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    
    // Validate required fields
    if (!name || !price || !sku) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: name, price, sku'
      }, { status: 400 });
    }
    
    // Initialize Supabase client with SERVICE ROLE KEY for admin operations
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Insert product
    const { data, error } = await supabaseClient
      .from('products')
      .insert({
        name,
        sku,
        slug,
        price: parseFloat(price),
        description: description || '',
        category_id: category_id || null,
        inventory_quantity: inventory_quantity || 0,
        status: status || 'draft',
        featured: featured || false,
        images: image_url ? JSON.stringify([image_url]) : null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error(' [DEBUG] Product creation error:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to create product: ' + error.message
      }, { status: 500 });
    }
    
    console.log(' [DEBUG] Product created successfully:', data.id);
    
    return NextResponse.json({
      success: true,
      data: data,
      message: 'Product created successfully'
    });
    
  } catch (error) {
    console.error(' [DEBUG] Create product API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create product: ' + (error as Error)?.message
    }, { status: 500 });
  }
}

// PUT - Update product
export async function PUT(request: NextRequest) {
  try {
    console.log(' [DEBUG] === UPDATE PRODUCT API ROUTE CALLED ===');
    
    // Validate admin token
    const validation = validateAdminToken(request);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - Invalid admin token'
      }, { status: 401 });
    }
    
    // Get product ID from URL
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Product ID is required'
      }, { status: 400 });
    }
    
    // Parse request body
    const body = await request.json();
    const { name, sku, price, description, category_id, inventory_quantity, status, featured, image_url } = body;
    
    // Initialize Supabase client with SERVICE ROLE KEY for admin operations
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
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
        images: image_url ? JSON.stringify([image_url]) : null
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(' [DEBUG] Product update error:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to update product: ' + error.message
      }, { status: 500 });
    }
    
    console.log(' [DEBUG] Product updated successfully:', data.id);
    
    return NextResponse.json({
      success: true,
      data: data,
      message: 'Product updated successfully'
    });
    
  } catch (error) {
    console.error(' [DEBUG] Update product API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update product: ' + (error as Error)?.message
    }, { status: 500 });
  }
}

// DELETE - Delete product
export async function DELETE(request: NextRequest) {
  try {
    console.log(' [DEBUG] === DELETE PRODUCT API ROUTE CALLED ===');
    
    // Validate admin token
    const validation = validateAdminToken(request);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - Invalid admin token'
      }, { status: 401 });
    }
    
    // Get product ID from URL
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Product ID is required'
      }, { status: 400 });
    }
    
    // Initialize Supabase client with SERVICE ROLE KEY for admin operations
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Delete product
    const { error } = await supabaseClient
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(' [DEBUG] Product deletion error:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to delete product: ' + error.message
      }, { status: 500 });
    }
    
    console.log(' [DEBUG] Product deleted successfully:', id);
    
    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });
    
  } catch (error) {
    console.error(' [DEBUG] Delete product API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete product: ' + (error as Error)?.message
    }, { status: 500 });
  }
}
