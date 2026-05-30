export interface Product {
  id: string;
  name: string; // Required field
  slug: string; // Required field
  description?: string;
  price: number;
  compare_price?: number;
  sku: string;
  status: string;
  featured: boolean;
  stock_quantity: number;
  inventory_quantity: number;
  track_inventory: boolean;
  allow_backorder: boolean;
  images: string[];
  video_url?: string;
  videos?: string[];
  category_id?: string;
  // Category relationship from products.category_id → categories.id
  category?: {
    id: string;
    name: string; // Required field
    slug?: string;
  } | null;
  // Legacy field for backward compatibility
  categories?: {
    id: string;
    name: string; // Required field
    slug?: string;
  } | null;
  created_at: string;
  updated_at?: string;
  // Additional fields for frontend compatibility
  rating?: number;
  reviewCount?: number;
  reviews?: number;
  inStock?: boolean;
  discountPrice?: number;
  // Legacy field mappings
  image?: string;
  image_url?: string;
  image_path?: string;
  stock?: number;
  comparePrice?: number;
  category_name?: string;
  _count?: {
    orderItems: number;
  };
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string; // Required field
  slug?: string;
  description?: string;
  image_url?: string;
  parent_id?: string;
  sort_order: number;
  is_active: boolean;
  product_count?: number;
  created_at: string;
  updated_at?: string;
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

// Helper functions for product data normalization
export const normalizeProduct = (product: any): Product => {
  if (!product || !product.id) {
    throw new Error('Invalid product: missing required fields');
  }
  
  return {
    ...product,
    // Normalize field names with defensive defaults
    name: product.name || 'Unnamed Product',
    description: product.description || '',
    stock_quantity: product.stock_quantity || product.stock || product.inventory_quantity || 0,
    compare_price: product.compare_price || product.comparePrice || undefined,
    category_name: product.category_name || product.category?.name || product.categories?.name || 'Uncategorized',
    image: product.image || (product.images && product.images.length > 0 ? product.images[0] : undefined) || '/placeholder-product.jpg',
    image_url: product.image_url || product.image || (product.images && product.images.length > 0 ? product.images[0] : undefined) || '/placeholder-product.jpg',
    image_path: product.image_path || product.image,
    videos: (product.videos && product.videos.length !== undefined) ? product.videos : (product.video_url ? [product.video_url] : []),
    images: (product.images && product.images.length !== undefined) ? product.images : [],
    rating: product.rating || 0,
    reviews: product.reviews || product.reviewCount || 0,
    createdAt: product.createdAt || product.created_at || new Date().toISOString(),
    // Computed fields
    inStock: (product.inventory_quantity > 0 || product.allow_backorder) ?? false,
  };
};

export const formatPrice = (price: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price);
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

export const getProductImage = (product: Product, index: number = 0): string => {
  if (!product) return '/placeholder-product.jpg';
  
  if (product.images && product.images.length > 0 && index >= 0 && index < product.images.length) {
    return product.images[index] ?? product.image ?? product.image_url ?? '/placeholder-product.jpg';
  }
  return product.image ?? product.image_url ?? '/placeholder-product.jpg';
};

export const hasDiscount = (product: Product): boolean => {
  return !!(product.compare_price && product.compare_price > product.price);
};

export const getDiscountPercentage = (product: Product): number => {
  if (!hasDiscount(product)) return 0;
  // Use parseInt as a workaround for Math.round issue
  return parseInt(String(((product.compare_price! - product.price) / product.compare_price!) * 100 + 0.5));
};

// Validation utilities
export const validateProduct = (product: any): product is Product => {
  return (
    product &&
    typeof product === 'object' &&
    typeof product.id === 'string' &&
    typeof product.name === 'string' &&
    typeof product.price === 'number' &&
    typeof product.sku === 'string' &&
    typeof product.status === 'string' &&
    typeof product.featured === 'boolean' &&
    typeof product.stock_quantity === 'number' &&
    typeof product.inventory_quantity === 'number' &&
    typeof product.track_inventory === 'boolean' &&
    typeof product.allow_backorder === 'boolean' &&
    (product.images && product.images.length !== undefined) &&
    typeof product.created_at === 'string'
  );
};

export const validateCategory = (category: any): category is Category => {
  return (
    category &&
    typeof category === 'object' &&
    typeof category.id === 'string' &&
    typeof category.name === 'string' &&
    typeof category.sort_order === 'number' &&
    typeof category.is_active === 'boolean' &&
    typeof category.created_at === 'string'
  );
};

export const safeProductMap = <T>(
  products: any[], 
  mapper: (product: Product) => T
): T[] => {
  return products
    .filter(validateProduct)
    .map(mapper);
};

export const safeCategoryMap = <T>(
  categories: any[], 
  mapper: (category: Category) => T
): T[] => {
  return categories
    .filter(validateCategory)
    .map(mapper);
};
