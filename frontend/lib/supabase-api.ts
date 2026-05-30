// Supabase Data API utilities for fetching products without using @supabase/supabase-js

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// Simple in-memory cache for deduplication
const requestCache = new Map<string, Promise<any>>();
const CACHE_TTL = 5000; // 5 seconds

export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.');
  }

  return { url, anonKey };
}

export function createSupabaseHeaders(anonKey: string): Record<string, string> {
  return {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
}

export async function fetchFromSupabase<T>(
  tableName: string,
  options: {
    select?: string;
    limit?: number;
    offset?: number;
    orderBy?: string;
    filter?: string;
  } = {}
): Promise<T[]> {
  const { url, anonKey } = getSupabaseConfig();
  const headers = createSupabaseHeaders(anonKey);

  // Build query parameters with proper URL encoding
  const params = new URLSearchParams();
  
  if (options.select) {
    params.append('select', options.select);
  }
  
  if (options.limit) {
    params.append('limit', options.limit.toString());
  }
  
  if (options.offset) {
    params.append('offset', options.offset.toString());
  }
  
  if (options.orderBy) {
    params.append('order', options.orderBy);
  }
  
  if (options.filter) {
    params.append('and', `(${options.filter})`);
  }

  const queryString = params.toString();
  const cacheKey = `${tableName}:${queryString}`;

  // Check cache for existing request
  if (requestCache.has(cacheKey)) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Using cached request for: ${cacheKey}`);
    }
    return requestCache.get(cacheKey);
  }

  const apiUrl = `${url}/rest/v1/${tableName}${queryString ? `?${queryString}` : ''}`;

  if (process.env.NODE_ENV === 'development') {
    console.log(`Fetching from Supabase: ${apiUrl}`);
  }

  const requestPromise = fetch(apiUrl, {
    method: 'GET',
    headers,
    cache: 'no-cache' // Ensure fresh data
  })
  .then(async (response) => {
    if (!response.ok) {
      let errorData: Record<string, any> = {};
      let errorMessage = 'No additional error information available.';
      
      try {
        const text = await response.text();
        errorData = text ? JSON.parse(text) : {};
        errorMessage = errorData.message || errorData.details || errorData.error || text || 'No additional error information available.';
      } catch (e) {
        errorMessage = 'Failed to parse error response';
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.error('Supabase API Error:', {
          status: response.status,
          statusText: response.statusText,
          message: errorMessage,
          errorData,
          url: apiUrl
        });
      }
      
      throw new Error(
        `Supabase API Error: ${response.status} ${response.statusText}. ${errorMessage}`
      );
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Invalid response format:', data);
      }
      throw new Error('Invalid response format: expected array');
    }

    return data;
  })
  .finally(() => {
    // Remove from cache after TTL
    setTimeout(() => {
      requestCache.delete(cacheKey);
    }, CACHE_TTL);
  });

  // Store in cache
  requestCache.set(cacheKey, requestPromise);

  return requestPromise;
}

// Specific function for fetching products with fallback
export async function fetchAllProducts() {
  try {
    return await fetchFromSupabase<any>('products', {
      select: `*, categories(id, name, slug)`,
      orderBy: 'created_at.desc' // Order by newest first
    });
  } catch (error) {
    // Fallback to basic product fetch without category join if join fails
    if (process.env.NODE_ENV === 'development') {
      console.warn('Category join failed, falling back to basic product fetch:', error);
    }
    return await fetchFromSupabase<any>('products', {
      select: '*',
      orderBy: 'created_at.desc'
    });
  }
}

// Function to fetch products with pagination with fallback
export async function fetchProductsWithPagination(
  page: number = 1,
  limit: number = 20
) {
  const offset = (page - 1) * limit;
  
  try {
    const [products, countResult] = await Promise.all([
      fetchFromSupabase<any>('products', {
        select: `*, categories(id, name, slug)`,
        limit,
        offset,
        orderBy: 'created_at.desc'
      }),
      // Get total count
      fetchFromSupabase<any>('products', {
        select: 'id'
      })
    ]);

    return {
      products,
      pagination: {
        currentPage: page,
        limit,
        total: countResult.length,
        totalPages: Math.ceil(countResult.length / limit),
        hasNext: page * limit < countResult.length,
        hasPrev: page > 1
      }
    };
  } catch (error) {
    // Fallback to basic product fetch without category join if join fails
    if (process.env.NODE_ENV === 'development') {
      console.warn('Category join failed, falling back to basic product fetch:', error);
    }
    
    const [products, countResult] = await Promise.all([
      fetchFromSupabase<any>('products', {
        select: '*',
        limit,
        offset,
        orderBy: 'created_at.desc'
      }),
      fetchFromSupabase<any>('products', {
        select: 'id'
      })
    ]);

    return {
      products,
      pagination: {
        currentPage: page,
        limit,
        total: countResult.length,
        totalPages: Math.ceil(countResult.length / limit),
        hasNext: page * limit < countResult.length,
        hasPrev: page > 1
      }
    };
  }
}
