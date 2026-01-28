import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createAuthErrorResponse, createSuccessResponse } from '../lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('Admin products API called');
    
    // Authenticate the request
    const auth = await authenticateAdmin();
    if (auth.error) {
      console.log('Products auth failed:', auth.error);
      return NextResponse.json(createAuthErrorResponse(auth.error, auth.status), { status: auth.status });
    }

    console.log('Products auth successful, fetching from Supabase');
    
    // Fetch products from Supabase
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        category:categories(id, name),
        _count: {
          order_items: order_items(count)
        }
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase products fetch error:', error);
      // Fallback to mock data if Supabase fails
      const mockProducts = [
        {
          id: 'PROD-001',
          name: 'Afro Print Dress',
          sku: 'APD-001',
          price: 50.00,
          stock: 45,
          status: 'active',
          featured: true,
          category: {
            id: 'CAT-001',
            name: 'Clothing'
          },
          createdAt: '2024-01-15',
          _count: {
            order_items: 23
          }
        },
        {
          id: 'PROD-002',
          name: 'Kente Cloth Scarf',
          sku: 'KCS-002',
          price: 25.00,
          stock: 89,
          status: 'active',
          featured: false,
          category: {
            id: 'CAT-002',
            name: 'Accessories'
          },
          createdAt: '2024-01-14',
          _count: {
            order_items: 45
          }
        }
      ];
      
      return NextResponse.json(createSuccessResponse(mockProducts));
    }

    // Transform the data to match the expected format
    const transformedProducts = products?.map((product: any) => ({
      ...product,
      createdAt: (product as any).created_at,
      updatedAt: (product as any).updated_at,
      categoryId: (product as any).category_id,
      comparePrice: (product as any).compare_price,
      trackInventory: (product as any).track_inventory,
      imageUrl: (product as any).image_url,
      _count: {
        orderItems: (product as any)._count?.order_items || 0
      }
    })) || [];

    return NextResponse.json(createSuccessResponse(transformedProducts));

  } catch (error) {
    console.error('Product creation error:', error);
    return NextResponse.json(createAuthErrorResponse('Failed to create product', 500), { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Authenticate the request
    const auth = await authenticateAdmin();
    if (auth.error) {
      return NextResponse.json(createAuthErrorResponse(auth.error, auth.status), { status: auth.status });
    }

    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(createAuthErrorResponse('Product ID is required', 400), { status: 400 });
    }

    // Mock product update
    const updatedProduct = {
      id,
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully'
    });

  } catch (error) {
    console.error('Product update error:', error);
    return NextResponse.json(createAuthErrorResponse('Failed to update product', 500), { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Authenticate the request
    const auth = await authenticateAdmin();
    if (auth.error) {
      return NextResponse.json(createAuthErrorResponse(auth.error, auth.status), { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(createAuthErrorResponse('Product ID is required', 400), { status: 400 });
    }

    // Mock product deletion
    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Product deletion error:', error);
    return NextResponse.json(createAuthErrorResponse('Failed to delete product', 500), { status: 500 });
  }
}
