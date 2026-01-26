import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Mock categories data
    const categories = [
      {
        id: 'CAT-001',
        name: 'Clothing',
        slug: 'clothing',
        description: 'Afrocentric clothing and apparel',
        image: '/images/clothing.jpg',
        parentId: null,
        sortOrder: 1,
        isActive: true,
        _count: {
          products: 45
        }
      },
      {
        id: 'CAT-002',
        name: 'Accessories',
        slug: 'accessories',
        description: 'Fashion accessories and jewelry',
        image: '/images/accessories.jpg',
        parentId: null,
        sortOrder: 2,
        isActive: true,
        _count: {
          products: 89
        }
      },
      {
        id: 'CAT-003',
        name: 'Home & Living',
        slug: 'home-living',
        description: 'Home decor and lifestyle products',
        image: '/images/home.jpg',
        parentId: null,
        sortOrder: 3,
        isActive: true,
        _count: {
          products: 23
        }
      }
    ];

    return NextResponse.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Categories fetch error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch categories'
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Mock category creation
    const newCategory = {
      id: `CAT-${Date.now()}`,
      ...body,
      sortOrder: 999,
      isActive: true,
      _count: {
        products: 0
      }
    };

    return NextResponse.json({
      success: true,
      data: newCategory,
      message: 'Category created successfully'
    });

  } catch (error) {
    console.error('Category creation error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create category'
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
        message: 'Category ID is required'
      }, { status: 400 });
    }

    // Mock category update
    const updatedCategory = {
      id,
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: updatedCategory,
      message: 'Category updated successfully'
    });

  } catch (error) {
    console.error('Category update error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update category'
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
        message: 'Category ID is required'
      }, { status: 400 });
    }

    // Mock category deletion
    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Category deletion error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete category'
    }, { status: 500 });
  }
}
