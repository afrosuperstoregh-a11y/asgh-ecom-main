'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Grid, List, Search, Filter, Package } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';

export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { categories, loading, error } = useCategories();

  // Filter categories based on search query
  const filteredCategories = categories.filter(category =>
    category && (
      category.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.slug?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">All Categories</h1>
              <p className="text-sm text-gray-600 mt-1">
                {categories.length} categories available
              </p>
            </div>
            
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Showing {filteredCategories.length} of {categories.length} categories
            </span>
            {error && (
              <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                Using cached data
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6' : 'space-y-4'}>
            {[...Array(8)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Categories Display */}
        {!loading && (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredCategories.map((category) => (
                  <Link 
                    key={category.id} 
                    href={`/products?category=${category.slug || category.id}`}
                    className="group block"
                  >
                    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
                      {/* Category Image */}
                      <div className="aspect-square bg-gray-100 overflow-hidden">
                        <img
                          src={category.image_url || '/placeholder-category.svg'}
                          alt={category.name || 'Category'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-category.svg';
                          }}
                        />
                      </div>
                      
                      {/* Category Info */}
                      <div className="p-4 text-center">
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 mb-2">
                          {category.name || 'Unnamed Category'}
                        </h3>
                        {category.product_count !== undefined && (
                          <p className="text-sm text-gray-500 mb-2">
                            {category.product_count} products
                          </p>
                        )}
                        <div className="flex items-center justify-center">
                          <Package className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-xs text-gray-500">
                            Browse {category.product_count || 0} items
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCategories.map((category) => (
                  <Link 
                    key={category.id} 
                    href={`/products?category=${category.slug || category.id}`}
                    className="group block"
                  >
                    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
                      <div className="flex items-center gap-6">
                        {/* Category Image */}
                        <div className="flex-shrink-0">
                          <img
                            src={category.image_url || '/placeholder-category.svg'}
                            alt={category.name || 'Category'}
                            className="w-20 h-20 object-cover rounded-lg"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder-category.svg';
                            }}
                          />
                        </div>
                        
                        {/* Category Info */}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 mb-2">
                            {category.name || 'Unnamed Category'}
                          </h3>
                          {category.product_count !== undefined && (
                            <p className="text-sm text-gray-500 mb-3">
                              {category.product_count} products available
                            </p>
                          )}
                          <div className="flex items-center">
                            <Package className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-600">
                              Browse collection
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <div className="mb-4">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? `No categories match "${searchQuery}"` : 'No categories available'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear search
              </button>
            )}
            <Link href="/" className="block mt-4 text-blue-600 hover:text-blue-700">
              Continue shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
