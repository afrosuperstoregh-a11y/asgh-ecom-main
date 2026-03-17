import { createClient } from '@supabase/supabase-js'

// Validate required environment variables
function validateEnvironment() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}. Please configure these in your hosting platform.`)
  }
}

// Mock products for fallback when database is not available
function getMockProducts() {
  const productNames = [
    'Girls Dashiki', 'Boys Dashiki', 'Banku Flour', 'Kenkey Mix', 'Fufu Powder',
    'Jollof Rice Mix', 'Palm Oil', 'Groundnut Oil', 'Shea Butter', 'Black Soap',
    'Kente Cloth', 'Ankara Fabric', 'African Print Shirt', 'Dashiki Robe', 'Buba Top',
    'Iro Wrapper', 'Gele Headtie', 'Agbada Gown', 'Kaftan Dress', 'Traditional Beads',
    'Cowrie Shell Necklace', 'Wooden Mask', 'African Sculpture', 'Drum Set', 'Calabash Bowl',
    'Tropical Fruit Basket', 'Plantain Chips', 'Coconut Water', 'Hibiscus Tea', 'Ginger Beer',
    'African Spice Mix', 'Peanut Butter', 'Moringa Powder', 'Baobab Fruit', 'Tamarind Paste',
    'Yam Flour', 'Cassava Flour', 'Millet Porridge', 'Sorghum Drink', 'Bambara Beans',
    'African Coffee', 'Rooibos Tea', 'Honeybush Tea', 'Marula Oil', 'Argan Oil',
    'African Black Soap', 'Neem Soap', 'Coconut Soap', 'Palm Kernel Oil', 'Shea Nut Oil',
    'Traditional Basket', 'Woven Mat', 'Leather Sandals', 'Beaded Jewelry', 'Wooden Bracelet',
    'African Art Print', 'Canvas Painting', 'Wall Hanging', 'Decorative Mask', 'Carved Statue',
    'Musical Instrument', 'Talking Drum', 'Mbira Thumb Piano', 'Kalimba', 'Shekere',
    'African Cookbook', 'Recipe Cards', 'Kitchen Utensils', 'Cooking Pot', 'Serving Tray',
    'Childrens Story Book', 'African Folk Tales', 'Coloring Book', 'Educational Games', 'Puzzle Set',
    'Essential Oil Set', 'Incense Sticks', 'Aromatherapy Candles', 'Room Spray', 'Potpourri',
    'Natural Lip Balm', 'Body Butter', 'Face Mask', 'Hair Oil', 'Skin Cream',
    'African Tea Set', 'Coffee Mug', 'Water Bottle', 'Lunch Box', 'Food Container',
    'Reusable Bag', 'Shopping Tote', 'Beach Towel', 'Picnic Blanket', 'Travel Pillow',
    'Phone Case', 'Laptop Sleeve', 'Tablet Cover', 'Cable Organizer', 'Desk Lamp',
    'Wall Clock', 'Picture Frame', 'Mirror Set', 'Candle Holder', 'Vase Collection',
    'Throw Pillows', 'Cushion Covers', 'Bed Sheets', 'Table Runner', 'Curtain Set',
    'Garden Tools', 'Plant Pot', 'Watering Can', 'Garden Gloves', 'Seeds Packet',
    'Pet Supplies', 'Dog Collar', 'Cat Toy', 'Bird Feeder', 'Fish Food',
    'Sports Equipment', 'Yoga Mat', 'Exercise Ball', 'Jump Rope', 'Water Bottle',
    'Party Supplies', 'Balloon Set', 'Party Decorations', 'Gift Wrap', 'Greeting Cards',
    'Office Supplies', 'Notebook Set', 'Pen Collection', 'Desk Organizer', 'File Folder',
    'Cleaning Supplies', 'Laundry Detergent', 'Dish Soap', 'Surface Cleaner', 'Trash Bags',
    'Storage Boxes', 'Organizer Bins', 'Clothing Rack', 'Shoe Rack', 'Book Shelf',
    'Emergency Kit', 'First Aid Box', 'Flashlight', 'Batteries', 'Tool Set',
    'Winter Accessories', 'Wool Scarf', 'Warm Gloves', 'Thermal Socks', 'Winter Hat',
    'Summer Essentials', 'Sun Hat', 'Sunglasses', 'Beach Bag', 'Cooling Towel',
    'Fitness Tracker', 'Smart Watch', 'Heart Monitor', 'Pedometer', 'Resistance Bands'
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
    images: [`https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/products/product-images/${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.svg`],
    categories: { name: 'Featured Products', slug: 'featured' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))
}

export async function GET(request: Request) {
  try {
    // Validate environment variables first
    validateEnvironment()
    
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

    // Test database connection but don't immediately fallback to mock data
    try {
      const { data: testConnection, error: connectionError } = await supabase
        .from('products')
        .select('id')
        .limit(1)
      
      if (connectionError) {
        console.error('Database connection error:', connectionError)
        // Continue with the main query - don't fallback to mock data yet
      }
    } catch (connectionTestError) {
      console.error('Database test failed:', connectionTestError)
      // Continue with the main query - don't fallback to mock data yet
    }

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
          if (supabaseUrl && img.startsWith('product-images/')) {
            return `${supabaseUrl}/storage/v1/object/public/products/${img}`;
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
