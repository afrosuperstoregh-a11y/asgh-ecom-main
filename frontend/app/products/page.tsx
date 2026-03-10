'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from "../../context/CartContext";
import { Loader2, Search, Filter, Grid, List, Star, ShoppingCart } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  comparePrice?: number;
  sku: string;
  status: string;
  featured: boolean;
  stock: number;
  images: string[];
  category: {
    id: string;
    name: string;
  };
  createdAt: string;
  _count: {
    orderItems: number;
  };
  // Additional fields for frontend compatibility
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
  discountPrice?: number;
}

export default function ProductsPage() {
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const { addToCart } = useCart();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Determine API URL
        const getApiUrl = () => {
          if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
              return 'http://localhost:3002';
            }
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || `${window.location.protocol}//${hostname}:3002`;
            return baseUrl.replace(/\/api$/, '');
          }
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
          return baseUrl.replace(/\/api$/, '');
        };

        const apiUrl = getApiUrl();
        console.log('Fetching products from:', `${apiUrl}/api/products`);

        const response = await fetch(`${apiUrl}/api/products`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status}`);
        }

        const data = await response.json();
        console.log('Products data:', data);
        
        // Handle different response formats
        const products = data.data?.products || data.products || data;
        setProductsList(Array.isArray(products) ? products : []);
      } catch (err) {
        console.error('Error loading products:', err);
        setError(err instanceof Error ? err.message : 'Failed to load products');
        setProductsList([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Filter products based on search query
  const filteredProducts = productsList.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.comparePrice || product.price,
      image: product.images[0] || '/placeholder-product.svg',
      category: product.category?.name || 'Uncategorized'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 max-w-md">
            <p className="text-red-800">Error loading products: {error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">All Products</h1>
          <p className="text-gray-600 text-sm sm:text-base">Discover our premium collection of products</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="h-5 w-5" />
              <span className="hidden sm:inline">Filters</span>
            </button>
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'} transition-colors`}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'} transition-colors`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-6">
          <p className="text-gray-600 text-sm sm:text-base">
            Showing {filteredProducts.length} of {productsList.length} products
          </p>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6' : 'space-y-4'}>
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                {viewMode === 'grid' ? (
                  <>
                    <Link href={`/product/${product.id}`}>
                      <div className="relative">
                        <img
                          src={product.images[0] || '/placeholder-product.jpg'}
                          alt={product.name}
                          className="w-full h-48 sm:h-56 object-cover rounded-t-lg"
                        />
                        {product.discountPrice && (
                          <span className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                            SALE
                          </span>
                        )}
                        {!product.inStock && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-t-lg">
                            <span className="text-white font-semibold">Out of Stock</span>
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base line-clamp-2">{product.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                      <div className="flex items-center mb-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.floor(product.rating || 0)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs sm:text-sm text-gray-500 ml-2">({product.reviewCount || 0})</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          {product.discountPrice ? (
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-gray-900">${product.discountPrice}</span>
                              <span className="text-sm text-gray-500 line-through">${product.price}</span>
                            </div>
                          ) : (
                            <span className="text-lg font-bold text-gray-900">${product.price}</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={!product.inStock}
                          className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors touch-target"
                          aria-label="Add to cart"
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center p-4 gap-4">
                    <Link href={`/product/${product.id}`} className="flex-shrink-0">
                      <div className="relative">
                        <img
                          src={product.images[0] || '/placeholder-product.jpg'}
                          alt={product.name}
                          className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
                        />
                        {!product.inStock && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                            <span className="text-white text-xs font-semibold">Out of Stock</span>
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base line-clamp-2">{product.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <div>
                          {product.discountPrice ? (
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-gray-900">${product.discountPrice}</span>
                              <span className="text-sm text-gray-500 line-through">${product.price}</span>
                            </div>
                          ) : (
                            <span className="text-lg font-bold text-gray-900">${product.price}</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={!product.inStock}
                          className="bg-primary-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm touch-target"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mb-4">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? `No products match "${searchQuery}"` : 'No products available'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear search
              </button>
            )}
            <Link href="/" className="block mt-4 text-primary-600 hover:text-primary-700">
              Continue shopping
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
