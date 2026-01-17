'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import FilterSidebar from '@/components/FilterSidebar';
import MobileFilterDrawer from '@/components/MobileFilterDrawer';
import SortBar from '@/components/SortBar';
import Pagination, { PaginationInfo } from '@/components/Pagination';
import { Product } from '@/data/products';

// Skeleton loader component
function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
      <div className="bg-gray-200 h-80 rounded-lg mb-4"></div>
      <div className="h-4 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
    </div>
  );
}

function ShopPageContent() {
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Filters state
  const [filters, setFilters] = useState({
    category: searchParams?.get('category') || 'all-products',
    brand: searchParams?.get('brand') || '',
    minPrice: parseFloat(searchParams?.get('minPrice') || '0'),
    maxPrice: parseFloat(searchParams?.get('maxPrice') || '999999'),
    color: searchParams?.get('color') || '',
    size: searchParams?.get('size') || '',
    rating: parseFloat(searchParams?.get('rating') || '0'),
    inStock: searchParams?.get('inStock') === 'true',
    discount: searchParams?.get('discount') === 'true',
    search: searchParams?.get('search') || ''
  });

  // Sort state
  const [sort, setSort] = useState(searchParams?.get('sort') || 'featured');

  // Build query string from filters and sort
  const buildQueryString = (page: number = 1) => {
    const params = new URLSearchParams();
    
    if (filters.category && filters.category !== 'all-products') params.set('category', filters.category);
    if (filters.brand) params.set('brand', filters.brand);
    if (filters.minPrice > 0) params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice < 999999) params.set('maxPrice', filters.maxPrice.toString());
    if (filters.color) params.set('color', filters.color);
    if (filters.size) params.set('size', filters.size);
    if (filters.rating > 0) params.set('rating', filters.rating.toString());
    if (filters.inStock) params.set('inStock', 'true');
    if (filters.discount) params.set('discount', 'true');
    if (filters.search) params.set('search', filters.search);
    if (sort !== 'featured') params.set('sort', sort);
    
    params.set('page', page.toString());
    params.set('limit', '12');
    
    return params.toString();
  };

  // Fetch products
  const fetchProducts = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryString = buildQueryString(page);
      const response = await fetch(`/api/products?${queryString}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      
      setProducts(data.products);
      setCurrentPage(data.pagination.page);
      setTotalPages(data.pagination.totalPages);
      setTotalProducts(data.pagination.totalProducts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle sort changes
  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    setCurrentPage(1); // Reset to first page when sort changes
  };

  // Clear all filters
  const handleClearFilters = () => {
    handleFiltersChange({
      category: 'all-products',
      brand: '',
      minPrice: 0,
      maxPrice: 999999,
      color: '',
      size: '',
      rating: 0,
      inStock: false,
      discount: false,
      search: ''
    });
  };

  // Apply filters (for mobile drawer)
  const handleApplyFilters = () => {
    fetchProducts(1);
  };

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchProducts(page);
  };

  // Initial fetch and when filters/sort change
  useEffect(() => {
    fetchProducts(1);
  }, [filters, sort]);

  // Update URL when filters change
  useEffect(() => {
    const queryString = buildQueryString(currentPage);
    const newUrl = queryString ? `/shop?${queryString}` : '/shop';
    window.history.replaceState({}, '', newUrl);
  }, [filters, sort, currentPage]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex text-sm text-gray-500">
            <a href="/" className="hover:text-gray-700">Home</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Shop</span>
          </nav>
        </div>
      </div>

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Shop</h1>
          <p className="text-gray-600 max-w-3xl">
            Discover our curated collection of premium products. From fashion to electronics, 
            find everything you need with our quality guarantee and exceptional customer service.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Desktop Only */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <FilterSidebar
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort Bar */}
            <SortBar
              totalProducts={totalProducts}
              currentSort={sort}
              onSortChange={handleSortChange}
              onMobileFilterOpen={() => setIsMobileFilterOpen(true)}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            {/* Loading State */}
            {loading && (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1'
              }`}>
                {[...Array(8)].map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="text-center py-12">
                <div className="text-red-500 text-lg font-medium mb-2">
                  Error: {error}
                </div>
                <button
                  onClick={() => fetchProducts(currentPage)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && products.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg font-medium mb-2">
                  No products found
                </div>
                <p className="text-gray-400 mb-4">
                  Try adjusting your filters or search terms
                </p>
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Products Grid */}
            {!loading && !error && products.length > 0 && (
              <>
                <div className={`grid gap-6 mb-8 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                    : 'grid-cols-1'
                }`}>
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col items-center gap-4">
                    <PaginationInfo
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={totalProducts}
                      itemsPerPage={12}
                    />
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        onApplyFilters={handleApplyFilters}
      />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ShopPageContent />
    </Suspense>
  );
}
