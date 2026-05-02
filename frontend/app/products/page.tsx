'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from "../../context/CartContext";
import { Loader2, Search, Filter, Grid, List, Star, ShoppingCart, X } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import FilterPanel from '@/components/FilterPanel';
import ProductCard from '@/components/ProductCard';
import { fixImageUrlWithFallback } from '@/lib/supabase-storage';

import { Product } from '@/types/product';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [currentPage, setCurrentPage] = useState(1);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const { addToCart } = useCart();

  // Use our custom hook for products with real-time updates
  const { products, loading, error, pagination, refetch } = useProducts({
    page: currentPage,
    limit: 50, // Use reasonable limit with pagination
    category: selectedCategory,
    search: searchQuery,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined
  });

  const { categories } = useCategories();

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    refetch();
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setCurrentPage(1);
  };

  const handleAddToCart = (product: any) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.compare_price || product.price,
      image: product.images?.[0] || product.image || '/placeholder-product.jpg',
      category: product.categories?.name || 'Uncategorized'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading products...</p>
          </div>
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

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 w-full overflow-x-hidden">
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsFilterPanelOpen(true)}
              className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-5 w-5" />
              <span className="hidden sm:inline">Filters</span>
              {(selectedCategory || minPrice || maxPrice) && (
                <span className="ml-2 h-2 w-2 bg-blue-600 rounded-full"></span>
              )}
            </button>
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'} transition-colors`}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'} transition-colors`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {(selectedCategory || minPrice || maxPrice) && (
          <div className="mb-6 flex flex-wrap gap-2">
            {selectedCategory && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                Category: {categories?.find(c => c.slug === selectedCategory)?.name || selectedCategory}
                <button
                  onClick={() => setSelectedCategory('')}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {minPrice && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                Min: ${minPrice}
                <button
                  onClick={() => setMinPrice('')}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {maxPrice && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                Max: ${maxPrice}
                <button
                  onClick={() => setMaxPrice('')}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Results count */}
        <div className="mb-6">
          <p className="text-gray-600 text-sm sm:text-base">
            Showing {products.length} of {pagination?.total_items || 0} products
          </p>
          {error && (
            <span className="ml-4 text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
              Using cached data
            </span>
          )}
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <ErrorBoundary>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 w-full overflow-x-hidden' : 'space-y-6'}>
            {products.map((product) => (
              <div key={product.id}>
                {viewMode === 'grid' ? (
                  <ProductCard product={product} />
                ) : (
                  <div className="flex items-center p-4 gap-4 h-full bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300">
                    <Link href={`/product/${product.id}`} className="flex-shrink-0">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                        <Image
                          src={fixImageUrlWithFallback(product.images?.[0] || product.image)}
                          alt={product.name}
                          fill
                          className="object-cover rounded-lg"
                          sizes="80px"
                        />
                        {!(product.inventory_quantity > 0 || product.allow_backorder) && (
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
                          {product.compare_price ? (
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-gray-900">${product.compare_price}</span>
                              <span className="text-sm text-gray-500 line-through">${product.price}</span>
                            </div>
                          ) : (
                            <span className="text-lg font-bold text-gray-900">${product.price}</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={!(product.inventory_quantity > 0 || product.allow_backorder)}
                          className="bg-blue-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
                        >
                          {(product.inventory_quantity > 0 || product.allow_backorder) ? 'Add to Cart' : 'Out of Stock'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            </div>
          </ErrorBoundary>
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

        {/* Pagination */}
        {!loading && pagination && pagination.total_pages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-3 py-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              
              {[...Array(pagination.total_pages)].map((_, index) => {
                const page = index + 1;
                const isCurrentPage = page === currentPage;
                const isNearCurrent = Math.abs(page - currentPage) <= 2;
                const showEllipsis = page === 3 && currentPage > 5;
                const showEllipsisEnd = page === pagination.total_pages - 2 && currentPage < pagination.total_pages - 4;

                if (!isNearCurrent && !showEllipsis && !showEllipsisEnd) return null;

                if (showEllipsis || showEllipsisEnd) {
                  return <span key={page} className="px-2">...</span>;
                }

                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 rounded-md ${
                      isCurrentPage
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= pagination.total_pages}
                className="px-3 py-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>
      
      {/* Filter Panel */}
      <FilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        minPrice={minPrice}
        maxPrice={maxPrice}
        onMinPriceChange={setMinPrice}
        onMaxPriceChange={setMaxPrice}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
      />
      </div>
    </ErrorBoundary>
  );
}
