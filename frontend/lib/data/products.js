// Real products API - replaces mock data
// This file now uses the real API instead of dummy data

import { api } from '../api/products';

// Export the real API functions
export { 
  api,
  formatPrice,
  getProductImage,
  isInStock,
  getStockStatus,
  getDefaultProduct,
  Product,
  Category,
  Pagination,
  ProductsResponse,
  CategoriesResponse
} from '../api/products';

// Legacy export for backward compatibility
// Now returns real data from API instead of mock data
export const products = {
  // Get all products with optional filters
  getAll: async (params = {}) => {
    try {
      const response = await api.getProducts(params);
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  // Get single product by ID or slug
  getById: async (idOrSlug) => {
    try {
      const response = await api.getProduct(idOrSlug);
      return response.data;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  },

  // Get products by category
  getByCategory: async (categoryId, params = {}) => {
    try {
      const response = await api.getProductsByCategory(categoryId, params);
      return response.data;
    } catch (error) {
      console.error('Error fetching products by category:', error);
      return [];
    }
  },

  // Search products
  search: async (query, params = {}) => {
    try {
      const response = await api.getProducts({ ...params, search: query });
      return response.data;
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }
};

// Categories API
export const categories = {
  // Get all categories
  getAll: async () => {
    try {
      const response = await api.getCategories();
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  // Get single category by ID or slug
  getById: async (idOrSlug) => {
    try {
      const response = await api.getCategory(idOrSlug);
      return response.data;
    } catch (error) {
      console.error('Error fetching category:', error);
      return null;
    }
  }
};

// Note: All mock data has been removed.
// This file now serves as a wrapper around the real API.
// Update your components to handle async data fetching.
