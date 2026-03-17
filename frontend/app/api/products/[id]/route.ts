import { createClient } from '@supabase/supabase-js'

// Validate required environment variables
function validateEnvironment() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(', ')}. Will use fallback data.`);
    return false; // Return false instead of throwing error
  }
  return true; // Return true if all variables are present
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate environment variables first
    const hasValidEnv = validateEnvironment()
    
    if (!hasValidEnv) {
      return new Response(JSON.stringify({ 
        error: 'Environment variables not configured',
        message: 'Product details unavailable'
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Create Supabase client inside the function to avoid build-time issues
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Await params to get the id
    const { id } = await params

    // Test database connection
    try {
      const { data: testConnection, error: connectionError } = await supabaseAdmin
        .from('products')
        .select('id')
        .limit(1)
      
      if (connectionError) {
        console.error('Database connection error:', connectionError)
        return new Response(JSON.stringify({
          success: false,
          error: 'Database connection failed'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    } catch (connectionTestError) {
      console.error('Database test failed:', connectionTestError)
      return new Response(JSON.stringify({
        success: false,
        error: 'Database test failed'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Query for the specific product
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        categories!inner(name, slug)
      `)
      .eq('id', id)
      .eq('status', 'active')
      .single()

    if (error) {
      console.error('Supabase query error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      return new Response(JSON.stringify({ 
        success: false,
        error: error.message,
        details: error.details,
        code: error.code
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!product) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Product not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Process product to ensure images are arrays and handle URLs properly
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

    const processedProduct = {
      ...product,
      images: images.length > 0 ? images : ['/placeholder-product.jpg']
    };

    return new Response(JSON.stringify({
      success: true,
      data: processedProduct
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in product API:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
