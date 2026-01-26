import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Mock products data
    const products = [
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
          orderItems: 23
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
          orderItems: 45
        }
      },
      {
        id: 'PROD-003',
        name: 'Ankara Headwrap',
        sku: 'AHW-003',
        price: 30.00,
        stock: 156,
        status: 'active',
        featured: true,
        category: {
          id: 'CAT-002',
          name: 'Accessories'
        },
        createdAt: '2024-01-13',
        _count: {
          orderItems: 67
        }
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: {
          page: 1,
          limit: 10,
          total: 3,
          totalPages: 1
        }
      }
    });

  } catch (error) {
    console.error('Products fetch error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch products'
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Mock product creation
    const newProduct = {
      id: `PROD-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
      _count: {
        orderItems: 0
      }
    };

    return NextResponse.json({
      success: true,
      data: newProduct,
      message: 'Product created successfully'
    });

  } catch (error) {
    console.error('Product creation error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create product'
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Product ID is required'
      }, { status: 400 });
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
    return NextResponse.json({
      success: false,
      message: 'Failed to update product'
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Product ID is required'
      }, { status: 400 });
    }

    // Mock product deletion
    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Product deletion error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete product'
    }, { status: 500 });
  }
}
