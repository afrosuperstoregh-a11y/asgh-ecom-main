'use client';

import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { Product } from '@/types/product';
import { fetchAllProducts, fetchProductsWithPagination } from '@/lib/supabase-api';

interface SupabaseProduct {
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
  rating?: number;
  reviews?: number;
  image_url?: string;
}

export default function AllProductsGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all products using our utility function
      const data = await fetchAllProducts();

      console.log(`Fetched ${data.length} products from Supabase`);

      // Transform Supabase data to match our Product interface
      const transformedProducts: Product[] = data.map((item: any): Product => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        compare_price: item.compare_price,
        sku: item.sku,
        status: item.status,
        featured: item.featured,
        stock_quantity: item.stock_quantity,
        inventory_quantity: item.inventory_quantity,
        track_inventory: item.track_inventory,
        allow_backorder: item.allow_backorder,
        images: item.images || [],
        video_url: item.video_url,
        videos: item.videos,
        category_id: item.category_id,
        category: item.category,
        categories: item.categories,
        created_at: item.created_at,
        updated_at: item.updated_at,
        rating: item.rating || 0,
        reviews: item.reviews || 0,
        image_url: item.image_url || (item.images && item.images[0]) || '/placeholder-product.jpg',
        category_name: item.category?.name || item.categories?.name,
        inStock: (item.inventory_quantity > 0 || item.allow_backorder) ?? false,
      }));

      setProducts(transformedProducts);

      if (transformedProducts.length === 0) {
        console.warn('No products found in the database');
      } else if (transformedProducts.length < 173) {
        console.warn(`Expected 173 products but only found ${transformedProducts.length}`);
      } else {
        console.log(`Successfully loaded all ${transformedProducts.length} products`);
      }

    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const retryFetch = () => {
    loadProducts();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">All Products</h1>
            <p className="text-gray-600">Loading products from database...</p>
          </div>
          
          {/* Loading skeleton grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
                <div className="bg-gray-200 h-48"></div>
                <div className="p-4 space-y-3">
                  <div className="bg-gray-200 h-4 rounded"></div>
                  <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                  <div className="bg-gray-200 h-6 rounded w-1/2"></div>
                  <div className="bg-gray-200 h-10 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-red-900 mb-4">Error Loading Products</h2>
              <p className="text-red-700 mb-6">{error}</p>
              <div className="space-y-4">
                <button
                  onClick={retryFetch}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
                <div className="text-sm text-gray-600">
                  <p>Please check:</p>
                  <ul className="list-disc list-inside mt-2 text-left">
                    <li>Supabase URL and API keys are correctly configured</li>
                    <li>The product table exists and has data</li>
                    <li>Row Level Security policies allow public access</li>
                    <li>Your network connection is stable</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Products</h1>
          <p className="text-gray-600">
            Showing {products.length} products
            {products.length < 173 && ` (Expected: 173)`}
          </p>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 w-full overflow-x-hidden">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-gray-100 rounded-lg p-8 max-w-md mx-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
              <p className="text-gray-600 mb-4">
                No products were found in the database. Please check your Supabase configuration and data.
              </p>
              <button
                onClick={retryFetch}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        )}

        {/* Debug Information */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 bg-gray-100 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Debug Information</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p>Total products loaded: {products.length}</p>
              <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Not configured'}</p>
              <p>Supabase Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configured' : 'Not configured'}</p>
              <p>Environment: {process.env.NODE_ENV}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
