// Real products API - replaces mock data
import { api, Product, Category, formatPrice, getProductImage, isInStock, getStockStatus } from '../lib/api/products';

// Export types for backward compatibility
export type { Product, Category } from '../lib/api/products';

// Export helper functions
export { formatPrice, getProductImage, isInStock, getStockStatus };

// Real API functions - replace mock data
export const products = {
  // Get all products with optional filters
  getAll: async (params?: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'ASC' | 'DESC';
    category?: string;
    search?: string;
  }) => {
    try {
      const response = await api.getProducts(params);
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  // Get single product by ID or slug
  getById: async (idOrSlug: string): Promise<Product | null> => {
    try {
      const response = await api.getProduct(idOrSlug);
      return response.data;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  },

  // Get products by category
  getByCategory: async (
    categoryId: string,
    params?: {
      page?: number;
      limit?: number;
      sort?: string;
      order?: 'ASC' | 'DESC';
    }
  ) => {
    try {
      const response = await api.getProductsByCategory(categoryId, params);
      return response.data;
    } catch (error) {
      console.error('Error fetching products by category:', error);
      return [];
    }
  },
};

// Categories API
export const categories = {
  // Get all categories
  getAll: async (): Promise<Category[]> => {
    try {
      const response = await api.getCategories();
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  // Get single category by ID or slug
  getById: async (idOrSlug: string): Promise<Category | null> => {
    try {
      const response = await api.getCategory(idOrSlug);
      return response.data;
    } catch (error) {
      console.error('Error fetching category:', error);
      return null;
    }
  },

  // Get categories with product counts (for backward compatibility)
  withCounts: async () => {
    try {
      const response = await api.getCategories();
      return response.data.map(cat => ({
        id: cat.slug,
        name: cat.name,
        count: cat.product_count || 0
      }));
    } catch (error) {
      console.error('Error fetching categories with counts:', error);
      return [];
    }
  },
};

// Legacy exports for backward compatibility
// These will now return real data from the API
export const getProducts = products.getAll;
export const getProduct = products.getById;
export const getProductsByCategory = products.getByCategory;
export const getCategories = categories.getAll;
export const getCategory = categories.getById;

// Default empty arrays for fallback (will be replaced by API calls)
export const brands: string[] = [];
export const allColors: string[] = [];
export const allSizes: string[] = [];

// Note: The mock data has been completely removed.
// All product and category data now comes from the real API.
// Please update your components to use the async functions above.
