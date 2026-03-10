// Real API service for products - replaces mock data
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // Use relative URLs for serverless functions in production
  : 'http://localhost:3002'; // Use local backend in development

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  sku: string;
  price: number;
  compare_price?: number;
  cost_price?: number;
  weight?: number;
  dimensions?: string;
  category_id: string;
  category_name?: string;
  category_slug?: string;
  images: string[];
  videos?: string[]; // New field for product videos
  tags: string[];
  inventory_quantity: number;
  track_inventory: boolean;
  allow_backorder: boolean;
  requires_shipping: boolean;
  is_digital: boolean;
  status: string;
  featured: boolean;
  seo_title?: string;
  seo_description?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: string;
  sort_order: number;
  is_active: boolean;
  product_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Pagination {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ProductsResponse {
  success: boolean;
  data: Product[];
  pagination: Pagination;
}

export interface CategoriesResponse {
  success: boolean;
  data: Category[];
  count?: number;
}

// API Functions
export const api = {
  // Products
  async getProducts(params?: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'ASC' | 'DESC';
    category?: string;
    search?: string;
  }): Promise<ProductsResponse> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(
      `${API_BASE_URL}/api/products?${searchParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    return response.json();
  },

  async getProduct(idOrSlug: string): Promise<{ success: boolean; data: Product }> {
    const response = await fetch(`${API_BASE_URL}/api/products/${idOrSlug}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.statusText}`);
    }

    return response.json();
  },

  async getProductsByCategory(
    categoryId: string,
    params?: {
      page?: number;
      limit?: number;
      sort?: string;
      order?: 'ASC' | 'DESC';
    }
  ): Promise<ProductsResponse> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(
      `${API_BASE_URL}/api/products/category/${categoryId}?${searchParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch products by category: ${response.statusText}`);
    }

    return response.json();
  },

  // Categories
  async getCategories(): Promise<CategoriesResponse> {
    const response = await fetch(`${API_BASE_URL}/api/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }

    return response.json();
  },

  async getCategory(idOrSlug: string): Promise<{ success: boolean; data: Category }> {
    const response = await fetch(`${API_BASE_URL}/api/categories/${idOrSlug}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch category: ${response.statusText}`);
    }

    return response.json();
  },

  // Admin functions (require authentication)
  async createProduct(productData: Partial<Product>, authToken: string): Promise<{ success: boolean; data: Product }> {
    const response = await fetch(`${API_BASE_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create product: ${response.statusText}`);
    }

    return response.json();
  },

  async updateProduct(
    idOrSlug: string, 
    productData: Partial<Product>, 
    authToken: string
  ): Promise<{ success: boolean; data: Product }> {
    const response = await fetch(`${API_BASE_URL}/api/products/${idOrSlug}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update product: ${response.statusText}`);
    }

    return response.json();
  },

  async deleteProduct(idOrSlug: string, authToken: string): Promise<{ success: boolean; data: Product }> {
    const response = await fetch(`${API_BASE_URL}/api/products/${idOrSlug}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete product: ${response.statusText}`);
    }

    return response.json();
  },
};

// Helper functions
export const formatPrice = (price: number, currency: string = 'CAD'): string => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
  }).format(price);
};

export const getProductImage = (product: Product): string => {
  if (product.images && product.images.length > 0) {
    return product.images[0];
  }
  return '/placeholder-product.jpg'; // Fallback image
};

export const isInStock = (product: Product): boolean => {
  return product.inventory_quantity > 0 || product.allow_backorder;
};

export const getStockStatus = (product: Product): string => {
  if (product.inventory_quantity > 0) {
    return `In Stock (${product.inventory_quantity} available)`;
  }
  if (product.allow_backorder) {
    return 'Backorder - Available to order';
  }
  return 'Out of Stock';
};

// Default product for empty categories
export const getDefaultProduct = (categoryName: string): Product => ({
  id: 'coming-soon',
  name: 'Coming Soon',
  slug: 'coming-soon',
  description: `Products will be available soon in ${categoryName}`,
  short_description: 'Products will be available soon',
  sku: 'COMING-SOON',
  price: 0,
  category_id: '',
  category_name: categoryName,
  images: ['/placeholder-product.jpg'],
  tags: [],
  inventory_quantity: 0,
  track_inventory: false,
  allow_backorder: false,
  requires_shipping: true,
  is_digital: false,
  status: 'draft',
  featured: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});
