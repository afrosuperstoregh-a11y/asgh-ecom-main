// Supabase Data API utilities for fetching products without using @supabase/supabase-js

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

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

  // Build query parameters
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
  const apiUrl = `${url}/rest/v1/${tableName}${queryString ? `?${queryString}` : ''}`;

  console.log(`Fetching from Supabase: ${apiUrl}`);

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers,
    cache: 'no-cache' // Ensure fresh data
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Supabase API Error: ${response.status} ${response.statusText}. ${
        errorData.message || 'No additional error information available.'
      }`
    );
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error('Invalid response format: expected array');
  }

  return data;
}

// Specific function for fetching products
export async function fetchAllProducts() {
  return fetchFromSupabase<any>('products', {
    select: '*', // Select all columns
    orderBy: 'created_at.desc' // Order by newest first
  });
}

// Function to fetch products with pagination
export async function fetchProductsWithPagination(
  page: number = 1,
  limit: number = 20
) {
  const offset = (page - 1) * limit;
  
  const [products, countResult] = await Promise.all([
    fetchFromSupabase<any>('products', {
      select: '*',
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
}
