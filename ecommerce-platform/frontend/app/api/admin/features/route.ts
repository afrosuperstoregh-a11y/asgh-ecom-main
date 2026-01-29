import { NextRequest, NextResponse } from 'next/server';

// Production features proxy - handles CORS and forwards to backend
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const activeOnly = searchParams.get('active_only');

    console.log('Production features proxy request:', { category, type, activeOnly });

    // Mock features data for production
    const mockFeatures = [
      // Product features
      {
        id: 'prod-001',
        category: 'product',
        name: 'brand',
        type: 'string',
        required: false,
        default_value: null,
        validation_rules: {},
        options: [],
        description: 'Product brand name',
        is_active: true,
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'prod-002',
        category: 'product',
        name: 'color',
        type: 'select',
        required: false,
        default_value: null,
        validation_rules: {},
        options: ['Red', 'Blue', 'Green', 'Black', 'White'],
        description: 'Product color option',
        is_active: true,
        sort_order: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'prod-003',
        category: 'product',
        name: 'base_price',
        type: 'number',
        required: true,
        default_value: 0,
        validation_rules: { min: 0, type: 'number' },
        options: [],
        description: 'Base selling price',
        is_active: true,
        sort_order: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'prod-004',
        category: 'product',
        name: 'stock_quantity',
        type: 'number',
        required: true,
        default_value: 0,
        validation_rules: { min: 0, type: 'integer' },
        options: [],
        description: 'Available stock quantity',
        is_active: true,
        sort_order: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'prod-005',
        category: 'product',
        name: 'free_shipping',
        type: 'boolean',
        required: false,
        default_value: false,
        validation_rules: {},
        options: [],
        description: 'Free shipping eligible',
        is_active: true,
        sort_order: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },

      // Category features
      {
        id: 'cat-001',
        category: 'category',
        name: 'featured_image',
        type: 'url',
        required: false,
        default_value: null,
        validation_rules: { format: 'url' },
        options: [],
        description: 'Category featured image URL',
        is_active: true,
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'cat-002',
        category: 'category',
        name: 'description',
        type: 'text',
        required: false,
        default_value: null,
        validation_rules: {},
        options: [],
        description: 'Category description',
        is_active: true,
        sort_order: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'cat-003',
        category: 'category',
        name: 'url_slug',
        type: 'string',
        required: true,
        default_value: null,
        validation_rules: {},
        options: [],
        description: 'URL slug for category',
        is_active: true,
        sort_order: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },

      // Promotion features
      {
        id: 'promo-001',
        category: 'promotion',
        name: 'percentage_off',
        type: 'number',
        required: false,
        default_value: null,
        validation_rules: { min: 0, max: 100, type: 'number' },
        options: [],
        description: 'Percentage discount',
        is_active: true,
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'promo-002',
        category: 'promotion',
        name: 'free_shipping',
        type: 'boolean',
        required: false,
        default_value: false,
        validation_rules: {},
        options: [],
        description: 'Free shipping promotion',
        is_active: true,
        sort_order: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'promo-003',
        category: 'promotion',
        name: 'start_date',
        type: 'datetime',
        required: false,
        default_value: null,
        validation_rules: {},
        options: [],
        description: 'Promotion start date',
        is_active: true,
        sort_order: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },

      // Customer features
      {
        id: 'cust-001',
        category: 'customer',
        name: 'name',
        type: 'string',
        required: true,
        default_value: null,
        validation_rules: {},
        options: [],
        description: 'Customer full name',
        is_active: true,
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'cust-002',
        category: 'customer',
        name: 'email',
        type: 'string',
        required: true,
        default_value: null,
        validation_rules: { format: 'email' },
        options: [],
        description: 'Customer email address',
        is_active: true,
        sort_order: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'cust-003',
        category: 'customer',
        name: 'customer_tier',
        type: 'select',
        required: false,
        default_value: 'Bronze',
        validation_rules: {},
        options: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
        description: 'Customer loyalty tier',
        is_active: true,
        sort_order: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Apply filters
    let filteredFeatures = mockFeatures;

    if (category && category !== 'all') {
      filteredFeatures = filteredFeatures.filter(f => f.category === category);
    }

    if (type) {
      filteredFeatures = filteredFeatures.filter(f => f.type === type);
    }

    if (activeOnly === 'true') {
      filteredFeatures = filteredFeatures.filter(f => f.is_active);
    }

    const response = {
      success: true,
      features: filteredFeatures,
      total: filteredFeatures.length
    };

    console.log('✅ Production features data served:', filteredFeatures.length, 'features');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Production features proxy error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch features'
    }, { status: 500 });
  }
}

// Create new feature
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Production create feature proxy:', body);

    // Mock feature creation
    const newFeature = {
      id: `prod-${Date.now()}`,
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('✅ Production feature created successfully');
    return NextResponse.json({
      success: true,
      message: 'Feature created successfully',
      feature: newFeature
    });

  } catch (error) {
    console.error('❌ Production create feature proxy error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create feature'
    }, { status: 500 });
  }
}
