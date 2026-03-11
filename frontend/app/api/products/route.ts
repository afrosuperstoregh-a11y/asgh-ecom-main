import { supabaseAdmin } from '../../../lib/supabase-server'

export async function GET(request: Request) {
  try {
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limitParam = searchParams.get('limit');
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'DESC';
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    
    // Determine if this is a request for all products (no limit) or limited request
    const shouldLimit = limitParam !== null;
    const limit = shouldLimit ? parseInt(limitParam) : null;
    const offset = shouldLimit && page > 1 && limit ? (page - 1) * limit : null;
    
    let query = supabaseAdmin
      .from('products')
      .select(`
        *,
        categories!inner(name, slug)
      `, { count: 'exact' })
      .eq('status', 'active');

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
      console.error('Supabase query error:', error);
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get unique categories for filter dropdown
    const { data: categoriesData } = await supabaseAdmin
      .from('categories')
      .select('slug')
      .eq('is_active', true);

    const uniqueCategories = [...new Set(categoriesData?.map((c: any) => c.slug) || [])];

    if (!products || products.length === 0) {
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
        products,
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
    console.error('Error in products API:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
