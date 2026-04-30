'use client';

import { useCategories } from '@/hooks/useCategories';
import Link from 'next/link';

interface Category {
  id: string | number;
  name: string;
  image_url: string;
  slug?: string;
  product_count?: number;
  created_at?: string;
}

export default function ShopByCategory() {
  const { categories, loading, error } = useCategories();

  // Debug logging
  console.log('ShopByCategory - Categories data:', {
    categories,
    loading,
    error,
    count: categories.length
  });

  if (loading) {
    return (
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Shop by Category</h2>
            <p className="text-base md:text-lg text-gray-600">Browse our wide range of categories</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="bg-gray-200 rounded-lg animate-pulse">
                <div className="aspect-square bg-gray-300 rounded-t-lg"></div>
                <div className="h-8 bg-gray-300 rounded-b-lg mt-2"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Shop by Category</h2>
            <p className="text-base md:text-lg text-gray-600">Browse our wide range of categories</p>
            {error && (
              <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                <p className="text-sm">Using cached data: {error}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return (
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Shop by Category</h2>
            <p className="text-base md:text-lg text-gray-600">Browse our wide range of categories</p>
          </div>
          <div className="text-center py-12">
            <p className="text-gray-500">No categories available at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Shop by Category</h2>
          <p className="text-base md:text-lg text-gray-600">Browse our wide range of categories</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {categories.filter(category => category && category.id).map((category) => (
            <Link 
              key={category.id} 
              href={`/products?category=${String(category.slug || category.id)}`}
              className="group block"
            >
              <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
                {/* Category Image */}
                <div className="aspect-square bg-gray-100 overflow-hidden">
                  <img
                    src={String(category.image_url) || '/placeholder-category.svg'}
                    alt={String(category.name) || 'Category'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-category.svg';
                    }}
                  />
                </div>
                
                {/* Category Name */}
                <div className="p-4 text-center">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                    {String(category.name) || 'Unnamed Category'}
                  </h3>
                  {category.product_count !== undefined && (
                    <p className="text-sm text-gray-500 mt-1">
                      {String(category.product_count)} products
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {/* View All Categories Link */}
        <div className="text-center mt-8 md:mt-12">
          <Link
            href="/categories"
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            View All Categories
          </Link>
        </div>
      </div>
    </section>
  );
}
