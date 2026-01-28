import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createAuthErrorResponse, createSuccessResponse } from '../lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('Admin categories API called');
    
    // Authenticate the request
    const auth = await authenticateAdmin();
    if (auth.error) {
      console.log('Categories auth failed:', auth.error);
      return NextResponse.json(createAuthErrorResponse(auth.error, auth.status), { status: auth.status });
    }

    console.log('Categories auth successful, returning data');
    
    // Mock categories data
    const categories = [
      {
        id: 'CAT-001',
        name: 'Clothing',
        slug: 'clothing',
        description: 'African clothing and apparel',
        image: '/images/categories/clothing.jpg',
        parentId: null,
        sortOrder: 1,
        isActive: true,
        children: [
          {
            id: 'CAT-001-1',
            name: 'Dresses',
            slug: 'dresses',
            description: 'African dresses',
            parentId: 'CAT-001',
            sortOrder: 1,
            isActive: true,
            _count: { products: 45 }
          },
          {
            id: 'CAT-001-2',
            name: 'Shirts',
            slug: 'shirts',
            description: 'African shirts and tops',
            parentId: 'CAT-001',
            sortOrder: 2,
            isActive: true,
            _count: { products: 32 }
          }
        ],
        _count: { products: 77 }
      },
      {
        id: 'CAT-002',
        name: 'Accessories',
        slug: 'accessories',
        description: 'African accessories and jewelry',
        image: '/images/categories/accessories.jpg',
        parentId: null,
        sortOrder: 2,
        isActive: true,
        children: [
          {
            id: 'CAT-002-1',
            name: 'Jewelry',
            slug: 'jewelry',
            description: 'African jewelry',
            parentId: 'CAT-002',
            sortOrder: 1,
            isActive: true,
            _count: { products: 28 }
          }
        ],
        _count: { products: 28 }
      },
      {
        id: 'CAT-003',
        name: 'Home Decor',
        slug: 'home-decor',
        description: 'African home decoration items',
        image: '/images/categories/home-decor.jpg',
        parentId: null,
        sortOrder: 3,
        isActive: true,
        children: [],
        _count: { products: 15 }
      }
    ];

    return NextResponse.json(createSuccessResponse(categories));

  } catch (error) {
    console.error('Categories API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch categories'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateAdmin();
    if (auth.error) {
      return NextResponse.json(createAuthErrorResponse(auth.error, auth.status), { status: auth.status });
    }

    const body = await request.json();
    console.log('Creating category:', body);

    // Mock category creation
    const newCategory = {
      id: `CAT-${Date.now()}`,
      ...body,
      isActive: true,
      sortOrder: 999,
      _count: { products: 0 }
    };

    return NextResponse.json(createSuccessResponse(newCategory));

  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create category'
    }, { status: 500 });
  }
}
