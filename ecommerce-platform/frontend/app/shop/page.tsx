'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { products as productsAPI, Product } from '../../data/products';
import { useCart } from "../../context/CartContext";
import { Loader2, Search, Filter, Grid, List, Star, ShoppingCart, X } from 'lucide-react';

// Extended product type for UI compatibility
interface UIProduct extends Product {
  brand: string;
  category: string;
  discountPrice?: number;
  colors: string[];
  sizes: string[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
}

function ShopPageContent() {
  const searchParams = useSearchParams();
  const [productsList, setProductsList] = useState<UIProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<UIProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('search') || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const { addToCart } = useCart();

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
    discount: searchParams?.get('discount') === 'true'
  });

  // Sort state
  const [sort, setSort] = useState(searchParams?.get('sort') || 'featured');

  useEffect(() => {
    // Load products from API
    const loadProducts = async () => {
      try {
        setLoading(true);
        // Fetch products from API
        const productsData = await productsAPI.getAll();
        
        // Transform API data to match UI expectations
        const transformedProducts = productsData.map(product => ({
          ...product,
          // Map API fields to UI expected fields
          brand: product.tags?.[0] || 'Unknown', // Use first tag as brand
          category: product.category_name || 'Uncategorized',
          discountPrice: product.compare_price && product.compare_price > product.price ? product.price : undefined,
          colors: [], // API doesn't have colors, use empty array
          sizes: [], // API doesn't have sizes, use empty array
          rating: 0, // API doesn't have rating, use default
          reviewCount: 0, // API doesn't have review count, use default
          inStock: product.inventory_quantity > 0 || product.allow_backorder
        }));
        
        setProductsList(transformedProducts);
        setFilteredProducts(transformedProducts);
      } catch (err) {
        console.error('Error loading products:', err);
        setProductsList([]);
        setFilteredProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    // Apply filters and search
    let filtered = productsList.filter(product => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        if (!product.name.toLowerCase().includes(searchLower) &&
            !product.description.toLowerCase().includes(searchLower) &&
            !product.brand.toLowerCase().includes(searchLower) &&
            !product.category.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Category filter
      if (filters.category !== 'all-products' && product.category !== filters.category) {
        return false;
      }

      // Brand filter
      if (filters.brand && product.brand !== filters.brand) {
        return false;
      }

      // Price filter
      const price = product.discountPrice || product.price;
      if (price < filters.minPrice || price > filters.maxPrice) {
        return false;
      }

      // Color filter
      if (filters.color && !product.colors.includes(filters.color)) {
        return false;
      }

      // Size filter
      if (filters.size && !product.sizes.includes(filters.size)) {
        return false;
      }

      // Rating filter
      if (filters.rating > 0 && product.rating < filters.rating) {
        return false;
      }

      // Stock filter
      if (filters.inStock && !product.inStock) {
        return false;
      }

      // Discount filter
      if (filters.discount && !product.discountPrice) {
        return false;
      }

      return true;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      const priceA = a.discountPrice || a.price;
      const priceB = b.discountPrice || b.price;

      switch (sort) {
        case 'price-low':
          return priceA - priceB;
        case 'price-high':
          return priceB - priceA;
        case 'rating':
          return b.rating - a.rating;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'new':
          return b.id.localeCompare(a.id);
        default: // featured
          return 0;
      }
    });

    setFilteredProducts(filtered);
  }, [productsList, searchQuery, filters, sort]);

  const handleAddToCart = (product: UIProduct) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.discountPrice || product.price,
      image: product.images[0],
      category: product.category
    });
  };

  const clearFilters = () => {
    setFilters({
      category: 'all-products',
      brand: '',
      minPrice: 0,
      maxPrice: 999999,
      color: '',
      size: '',
      rating: 0,
      inStock: false,
      discount: false
    });
    setSearchQuery('');
  };

  // Get unique values for filters
  const categories = ['all-products', ...new Set(productsList.map(p => p.category))];
  const brands = [...new Set(productsList.map(p => p.brand))];
  const colors = [...new Set(productsList.flatMap(p => p.colors))];
  const sizes = [...new Set(productsList.flatMap(p => p.sizes))];

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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Shop</h1>
          <p className="text-gray-600 text-sm sm:text-base">Discover our premium collection of products</p>
        </div>

        {/* Search and Filters Bar */}
        <div className="mb-6 flex flex-col lg:flex-row gap-4">
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
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-5 w-5" />
              Filters
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

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="hidden lg:block">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Clear all
                  </button>
                </div>

                {/* Category Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Category</h4>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({...filters, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat === 'all-products' ? 'All Products' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Brand Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Brand</h4>
                  <select
                    value={filters.brand}
                    onChange={(e) => setFilters({...filters, brand: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Brands</option>
                    {brands.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Price Range</h4>
                  <div className="space-y-3">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => setFilters({...filters, minPrice: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({...filters, maxPrice: parseFloat(e.target.value) || 999999})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Sort */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Sort By</h4>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="featured">Featured</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                    <option value="name">Name: A-Z</option>
                    <option value="new">Newest</option>
                  </select>
                </div>

                {/* Additional Filters */}
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.inStock}
                      onChange={(e) => setFilters({...filters, inStock: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">In Stock Only</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.discount}
                      onChange={(e) => setFilters({...filters, discount: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">On Sale</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Results count */}
            <div className="mb-6">
              <p className="text-gray-600 text-sm sm:text-base">
                Showing {filteredProducts.length} of {productsList.length} products
              </p>
            </div>

            {filteredProducts.length > 0 ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6' : 'space-y-4'}>
                {filteredProducts.map((product) => (
                  <div key={product.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    {viewMode === 'grid' ? (
                      <div>
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
                      </div>
                    ) : (
                      <div className="flex items-center p-4 gap-4">
                        <div className="relative flex-shrink-0">
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
                  {searchQuery || filters.category !== 'all-products' ? 'No products match your filters' : 'No products available'}
                </p>
                <button
                  onClick={clearFilters}
                  className="text-primary-600 hover:text-primary-700 font-medium mb-4"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Filter Drawer */}
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileFilterOpen(false)} />
            <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                  <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Mobile filters content - same as desktop */}
                <div className="space-y-6">
                  {/* Category Filter */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Category</h4>
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters({...filters, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat === 'all-products' ? 'All Products' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Brand Filter */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Brand</h4>
                    <select
                      value={filters.brand}
                      onChange={(e) => setFilters({...filters, brand: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">All Brands</option>
                      {brands.map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Price Range</h4>
                    <div className="space-y-3">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.minPrice}
                        onChange={(e) => setFilters({...filters, minPrice: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice}
                        onChange={(e) => setFilters({...filters, maxPrice: parseFloat(e.target.value) || 999999})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  {/* Sort */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Sort By</h4>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="featured">Featured</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="rating">Highest Rated</option>
                      <option value="name">Name: A-Z</option>
                      <option value="new">Newest</option>
                    </select>
                  </div>

                  {/* Additional Filters */}
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.inStock}
                        onChange={(e) => setFilters({...filters, inStock: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">In Stock Only</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.discount}
                        onChange={(e) => setFilters({...filters, discount: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">On Sale</span>
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={clearFilters}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setIsMobileFilterOpen(false)}
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading shop...</p>
          </div>
        </div>
      </div>
    }>
      <ShopPageContent />
    </Suspense>
  );
}
