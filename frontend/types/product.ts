export interface Product {
  id: string;
  name: string;
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
  category?: {
    id: string;
    name: string;
    slug?: string;
  };
  categories?: {
    id: string;
    name: string;
    slug?: string;
  };
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
  name: string;
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
  return {
    ...product,
    // Normalize field names
    stock_quantity: product.stock_quantity || product.stock || product.inventory_quantity || 0,
    compare_price: product.compare_price || product.comparePrice || product.compare_price || undefined,
    category_name: product.category_name || product.category?.name || product.categories?.name,
    image: product.image || (product.images && product.images[0]) || '/placeholder-product.jpg',
    image_url: product.image_url || product.image || (product.images && product.images[0]) || '/placeholder-product.jpg',
    image_path: product.image_path || product.image,
    videos: product.videos || (product.video_url ? [product.video_url] : []),
    rating: product.rating || 0,
    reviews: product.reviews || product.reviewCount || 0,
    createdAt: product.createdAt || product.created_at,
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
  if (product.images && product.images.length > index) {
    return product.images[index];
  }
  return product.image || '/placeholder-product.jpg';
};

export const hasDiscount = (product: Product): boolean => {
  return !!(product.compare_price && product.compare_price > product.price);
};

export const getDiscountPercentage = (product: Product): number => {
  if (!hasDiscount(product)) return 0;
  return Math.round(((product.compare_price! - product.price) / product.compare_price!) * 100);
};
