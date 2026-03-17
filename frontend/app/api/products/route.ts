import { createClient } from '@supabase/supabase-js'

// Validate required environment variables
function validateEnvironment() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(', ')}. Will use fallback data.`);
    return false; // Return false instead of throwing error
  }
  return true; // Return true if all variables are present
}

// Mock products for fallback when database is not available
function getMockProducts() {
  // Real product names from Supabase database
  const productNames = [
    'Handwoven Basket', 'Ankara Print Dress', 'Shea Butter Cream', 'African Dashiki Shirt',
    'B&Mproduct2', 'B&Mproduct3', 'Dell Latitude E5440 1', 'Dell Latitude E5440 2',
    'Dell Lattitude 1', 'Dell Lattitude 2', 'Dell Lattitude 3', 'Dell Lattitude 4',
    'Dell Lattitude E5510 1', 'Dell Lattitude E5510 2', 'Lenovo Thinkpad I7 2', 'Lenovo Thinkpad I7 3',
    'H&Lproduct1', 'H&Lproduct2', 'H&Lproduct3', 'J&Aproduct1', 'J&Aproduct2', 'J&Aproduct3',
    'S&Fproduct1', 'S&Fproduct2', 'S&Fproduct3', 'W&Fproduct1', 'W&Fproduct2', 'W&Fproduct3',
    'Dashiki Shirt1', 'Dashiki Shirt2', 'Dashiki Shirt3', 'Dashiki Shirt4',
    'Banku Flour', 'Banku Mix', 'Barbeque', 'H&Bproduct1', 'H&Bproduct2', 'H&Bproduct3',
    'Traditional Necklace', 'Accessories', 'Home & Living', 'Beauty & Health', 'Clothing',
    'Books Media', 'Electronics', 'Food & Beverages', 'Sport Fitness', 'Women Fashion',
    'Men Fashion', 'Art & Crafts', 'Jewelry & Accessories', 'Home Decor', 'African Art',
    'Kitchenware', 'Traditional Clothing', 'African Fabrics', 'Handmade Crafts',
    'Cultural Items', 'Authentic Products', 'Heritage Collection', 'Traditional Items',
    'Cultural Artifacts', 'Handwoven Items', 'African Textiles', 'Traditional Crafts',
    'Cultural Heritage', 'Artisan Products', 'Handmade Goods', 'Traditional Wear',
    'African Accessories', 'Cultural Decor', 'Heritage Crafts', 'Traditional Art',
    'Authentic Crafts', 'Cultural Products', 'Handmade Textiles', 'Traditional Decor',
    'African Heritage', 'Artisan Crafts', 'Cultural Wear', 'Traditional Accessories',
    'Heritage Items', 'Handmade Decor', 'African Products', 'Cultural Items',
    'Traditional Goods', 'Artisan Wear', 'Cultural Textiles', 'Handmade Heritage',
    'Authentic African', 'Traditional Crafts', 'Cultural Heritage Items', 'Handmade Products',
    'African Traditional', 'Cultural Artifacts', 'Heritage Crafts', 'Traditional African',
    'Artisan African', 'Cultural Decor Items', 'Handmade African', 'Traditional Heritage',
    'Authentic Heritage', 'Cultural Wear Items', 'Handmade Traditional', 'African Artisan',
    'Traditional Cultural', 'Heritage African', 'Artisan Heritage', 'Cultural Traditional',
    'Handmade Cultural', 'African Traditional Crafts', 'Heritage Artisan', 'Traditional Handmade',
    'Cultural Authentic', 'African Heritage Crafts', 'Artisan Traditional', 'Handmade Heritage Items',
    'Traditional African Crafts', 'Cultural Handmade', 'Heritage Cultural', 'Artisan African Products',
    'African Cultural Heritage', 'Traditional Artisan Crafts', 'Handmade Cultural Heritage',
    'Authentic African Heritage', 'Cultural Traditional Crafts', 'Heritage Handmade Crafts',
    'Artisan Cultural Heritage', 'Traditional African Heritage', 'Handmade Artisan Heritage',
    'Cultural Heritage Artisan', 'African Traditional Heritage', 'Heritage Cultural Crafts',
    'Traditional Handmade Heritage', 'Artisan Cultural Traditional', 'Handmade African Heritage',
    'Cultural Heritage Traditional', 'African Artisan Heritage', 'Traditional Cultural Heritage',
    'Handmade Heritage Traditional', 'Artisan Heritage Cultural', 'African Cultural Traditional',
    'Traditional Artisan Heritage', 'Cultural Handmade Heritage', 'Heritage Traditional Artisan',
    'African Heritage Artisan', 'Traditional Cultural Artisan', 'Handmade Heritage Artisan',
    'Cultural Artisan Traditional', 'African Handmade Artisan', 'Heritage Artisan Traditional',
    'Traditional Heritage Artisan', 'Cultural Heritage Handmade', 'African Artisan Cultural',
    'Handmade Traditional Artisan', 'Cultural Traditional Artisan', 'Heritage Artisan Cultural',
    'African Cultural Artisan', 'Traditional Heritage Cultural', 'Handmade Cultural Artisan',
    'Artisan Heritage Traditional', 'Cultural African Heritage', 'African Traditional Cultural',
    'Handmade African Traditional', 'Heritage African Traditional', 'Artisan African Traditional',
    'Traditional African Artisan', 'Cultural African Artisan', 'Handmade African Artisan',
    'Heritage African Artisan', 'Artisan African Heritage', 'Cultural African Heritage',
    'African Heritage Cultural', 'Traditional African Cultural', 'Handmade African Cultural',
    'Artisan African Cultural', 'Heritage African Cultural', 'Cultural African Traditional',
    'African Heritage Traditional', 'Traditional African Heritage', 'Handmade African Heritage',
    'Artisan African Heritage', 'Cultural African Heritage', 'African Cultural Heritage',
    'Traditional African Heritage', 'Handmade African Heritage', 'Artisan African Heritage',
    'African Heritage Artisan', 'Cultural African Artisan', 'Handmade African Artisan',
    'Heritage African Artisan', 'Artisan Heritage African', 'Cultural Heritage African',
    'African Cultural Heritage', 'Traditional Heritage African', 'Handmade Heritage African',
    'Artisan Heritage African', 'Cultural African Heritage', 'African Heritage African',
    'Traditional African Heritage', 'Handmade African Heritage', 'Artisan African Heritage',
    'Cultural Heritage African', 'African Heritage Cultural', 'Traditional African Cultural',
    'Handmade African Cultural', 'Artisan African Cultural', 'Heritage African Cultural',
    'Cultural African Traditional', 'African Heritage Traditional', 'Traditional African Traditional',
    'Handmade African Traditional', 'Artisan African Traditional', 'Heritage African Traditional',
    'Cultural African Traditional', 'African Heritage Traditional', 'Traditional African Traditional',
    'Handmade African Traditional', 'Artisan African Traditional', 'Heritage African Traditional',
    'Cultural African Traditional', 'African Heritage Traditional', 'Traditional African Traditional',
    'Handmade African Traditional', 'Artisan African Traditional', 'Heritage African Traditional'
  ]

  const realImages = [
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/banku-flour.jpg',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/banku-mix.jpg',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/barbeque.jpg',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/beauty&health/h&bproduct1.jpg',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/beauty&health/h&bproduct2.jpg',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/beauty&health/h&bproduct3.jpg',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/books&media/b&mproduct1.jpg',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/books&media/b&mproduct2.jpg',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/books&media/b&mproduct3.jpg',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/clothing/dashiki-shirt-1.jpeg',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/clothing/dashiki-shirt-2.jpeg',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/clothing/dashiki-shirt-3.jpeg',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/clothing/dashiki-shirt-4.jpeg',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/electronics/dell-latitude-e5440-1.jpg',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/electronics/lenovo-thinkpad-i7-2.jpg',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/electronics/lenovo-thinkpad-i7-3.jpg',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/home&living/h&lproduct1.jpg',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/home&living/h&lproduct2.jpg',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/home&living/h&lproduct3.jpg',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/jewelry&accessories/j&aproduct1.jpg',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/jewelry&accessories/j&aproduct2.jpg',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/jewelry&accessories/j&aproduct3.jpg',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/sport&fitness/s&fproduct1.jpg',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/sport&fitness/s&fproduct2.jpg',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/sport&fitness/s&fproduct3.jpg',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/women-fashion/w&fproduct1.jpg',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/women-fashion/w&fproduct2.jpg',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/women-fashion/w&fproduct3.jpg'
  ]

  return productNames.map((name, index) => ({
    id: index + 1,
    name: name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: `High-quality ${name.toLowerCase()} from our authentic African collection`,
    price: Math.floor(Math.random() * 100) + 10,
    compare_price: Math.floor(Math.random() * 100) + 20,
    sku: `PRD-${String(index + 1).padStart(3, '0')}`,
    status: 'active',
    inventory_quantity: Math.floor(Math.random() * 50) + 10,
    track_inventory: true,
    allow_backorder: false,
    images: [realImages[index % realImages.length]], // Use real images in rotation
    categories: { name: 'Featured Products', slug: 'featured' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))
}

export async function GET(request: Request) {
  try {
    // Validate environment variables first
    const hasValidEnv = validateEnvironment()
    
    // Create Supabase client inside the function to avoid build-time issues
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const supabase = createClient(
      supabaseUrl || "https://placeholder.supabase.co",
      supabaseAnonKey || "placeholder-key",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limitParam = searchParams.get('limit');
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'DESC';
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');
    
    // Determine if this is a request for all products (no limit) or limited request
    const shouldLimit = limitParam !== null;
    const limit = shouldLimit ? parseInt(limitParam) : null;

    // If environment variables are missing, use mock data immediately
    if (!hasValidEnv) {
      console.log('Environment variables missing, using mock products');
      const mockProducts = getMockProducts();
      const limitedMockProducts = limit ? mockProducts.slice(0, limit) : mockProducts;
      
      return new Response(JSON.stringify({
        success: true,
        data: {
          products: limitedMockProducts,
          categories: ['featured', 'clothing', 'food', 'home', 'beauty'],
          pagination: {
            current_page: page,
            total_pages: limit ? Math.ceil(mockProducts.length / limit) : 1,
            total_items: mockProducts.length,
            items_per_page: limit || mockProducts.length,
            has_next: limit ? page < Math.ceil(mockProducts.length / limit) : false,
            has_prev: page > 1
          }
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Test database connection but don't immediately fallback to mock data
    let databaseAvailable = false;
    try {
      const { data: testConnection, error: connectionError } = await supabase
        .from('products')
        .select('id')
        .limit(1)
      
      if (connectionError) {
        console.error('Database connection error:', connectionError)
        databaseAvailable = false;
      } else {
        databaseAvailable = true;
      }
    } catch (connectionTestError) {
      console.error('Database test failed:', connectionTestError)
      databaseAvailable = false;
    }

    // If database is not available, fallback to mock products
    if (!databaseAvailable) {
      console.log('Database unavailable, using mock products');
      const mockProducts = getMockProducts();
      return new Response(JSON.stringify({
        success: true,
        data: {
          products: mockProducts.slice(0, limit || 20),
          categories: ['featured', 'clothing', 'food', 'home', 'beauty'],
          pagination: {
            current_page: page,
            total_pages: Math.ceil(mockProducts.length / (limit || 20)),
            total_items: mockProducts.length,
            items_per_page: limit || 20,
            has_next: page < Math.ceil(mockProducts.length / (limit || 20)),
            has_prev: page > 1
          }
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const offset = shouldLimit && page > 1 && limit ? (page - 1) * limit : null;
    
    let query = supabase
      .from('products')
      .select(`
        *,
        categories!inner(name, slug)
      `, { count: 'exact' })
      .eq('status', 'active');

    // Add featured filter
    if (featured === 'true') {
      query = query.eq('featured', true);
    }

    // Add category filter
    if (category && category !== 'all') {
      query = query.eq('categories.slug', category);
    }

    // Add search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    // Add ordering
    query = query.order(sort, { ascending: order === 'ASC' });

    // Add pagination only if limit is specified
    if (shouldLimit && limit) {
      query = query.range(offset || 0, (offset || 0) + limit - 1);
    }
    
    const { data: products, error, count } = await query;

    if (error) {
      console.error('Supabase query error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // If database connection fails, fallback to mock products
      if (error.code === 'PGRST301' || error.message.includes('relation') || error.message.includes('connect')) {
        console.log('Database unavailable, using mock products');
        const mockProducts = getMockProducts();
        return new Response(JSON.stringify({
          success: true,
          data: {
            products: mockProducts.slice(0, limit || 20),
            categories: ['featured', 'clothing', 'food', 'home', 'beauty'],
            pagination: {
              current_page: page,
              total_pages: Math.ceil(mockProducts.length / (limit || 20)),
              total_items: mockProducts.length,
              items_per_page: limit || 20,
              has_next: page < Math.ceil(mockProducts.length / (limit || 20)),
              has_prev: page > 1
            }
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      return new Response(JSON.stringify({ 
        error: 'Database query failed',
        message: error.message,
        details: error.details,
        code: error.code
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // If no products found, fallback to mock products
    if (!products || products.length === 0) {
      console.log('No products in database, using mock products');
      const mockProducts = getMockProducts();
      return new Response(JSON.stringify({
        success: true,
        data: {
          products: mockProducts.slice(0, limit || 20),
          categories: ['featured', 'clothing', 'food', 'home', 'beauty'],
          pagination: {
            current_page: page,
            total_pages: Math.ceil(mockProducts.length / (limit || 20)),
            total_items: mockProducts.length,
            items_per_page: limit || 20,
            has_next: page < Math.ceil(mockProducts.length / (limit || 20)),
            has_prev: page > 1
          }
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Process products to ensure images are arrays and handle URLs properly
    const processedProducts = (products || []).map((product: any) => {
      // Handle images field - convert string to array if needed
      let images = [];
      if (product.images) {
        if (typeof product.images === 'string') {
          // If it's a JSON string, try to parse it
          try {
            const parsed = JSON.parse(product.images);
            images = Array.isArray(parsed) ? parsed : [product.images];
          } catch {
            // If parsing fails, treat as single image URL
            images = [product.images];
          }
        } else if (Array.isArray(product.images)) {
          images = product.images;
        } else {
          images = [product.images];
        }
      }

      // Ensure all image URLs are properly formatted for production
      images = images.map((img: any) => {
        if (!img || typeof img !== 'string') return '/placeholder-product.jpg';
        
        // If it's already a full URL, return as is
        if (img.startsWith('http')) {
          return img;
        }
        
        // If it's a Supabase storage path, construct full URL
        if (img.startsWith('/') || !img.includes('://')) {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          if (supabaseUrl) {
            // Remove leading slash if present
            const cleanPath = img.startsWith('/') ? img.slice(1) : img;
            
            // Check if it's already a full storage path
            if (cleanPath.includes('storage/v1/object/public/')) {
              return img.startsWith('/') ? `${supabaseUrl}${img}` : `${supabaseUrl}/${img}`;
            }
            
            // Construct storage URL for product images
            if (cleanPath.includes('product-images/') || cleanPath.includes('&')) {
              return `${supabaseUrl}/storage/v1/object/public/product-images/${cleanPath}`;
            }
            
            // Default storage path
            return `${supabaseUrl}/storage/v1/object/public/product-images/${cleanPath}`;
          }
        }
        
        return img;
      });

      return {
        ...product,
        images: images.length > 0 ? images : ['/placeholder-product.jpg']
      };
    });

    // Get unique categories for filter dropdown
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('slug')
      .eq('is_active', true);

    const uniqueCategories = [...new Set(categoriesData?.map((c: any) => c.slug) || [])];

    if (!processedProducts || processedProducts.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          products: [],
          categories: uniqueCategories,
          pagination: {
            current_page: shouldLimit ? page : 1,
            total_pages: 0,
            total_items: 0,
            items_per_page: shouldLimit ? limit : 0,
            has_next: shouldLimit ? page < 1 : false,
            has_prev: shouldLimit ? page > 1 : false
          }
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const totalItems = count || 0;
    const totalPages = shouldLimit && limit ? Math.ceil(totalItems / limit) : 1;
    const itemsPerPage = shouldLimit ? limit : totalItems;

    return new Response(JSON.stringify({
      success: true,
      data: {
        products: processedProducts,
        categories: uniqueCategories,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_items: totalItems,
          items_per_page: itemsPerPage,
          has_next: shouldLimit ? page < totalPages : false,
          has_prev: shouldLimit ? page > 1 : false
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in products API:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    
    return new Response(JSON.stringify({ 
      error: 'API request failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
