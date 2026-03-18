'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api/products';
import type { Product, Category } from '@/lib/api/products';
import ProductGrid from '@/components/ProductGrid';
import { formatPrice, getProductImage } from '@/lib/api/products';

export default function CategoryPage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategoryData = async () => {
      if (!slug) return;
      
      try {
        setLoading(true);
        setError(null);

        // Fetch category by slug
        const categoryResponse = await fetch(`${process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3002'}/api/categories/${slug}`);
        if (!categoryResponse.ok) {
          throw new Error('Category not found');
        }
        const categoryData = await categoryResponse.json();
        
        if (!categoryData.success || !categoryData.data) {
          throw new Error('Category not found');
        }

        setCategory(categoryData.data);

        // Fetch products for this category
        const productsResponse = await api.getProducts({
          category: categoryData.data.id,
          limit: 50
        });
        
        setProducts(productsResponse.data || []);
        
      } catch (err) {
        console.error('Error loading category data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load category');
      } finally {
        setLoading(false);
      }
    };

    loadCategoryData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-80"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Category Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The requested category could not be found.'}</p>
          <a 
            href="/" 
            className="inline-block bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Category Banner */}
      {category.image_url && (
        <div className="relative h-64 md:h-80 bg-gray-100">
          <img
            src={category.image_url}
            alt={category.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              (e.target as HTMLImageElement).src = '/placeholder-category.svg';
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-4xl md:text-5xl font-bold mb-2">{category.name}</h1>
              {category.description && (
                <p className="text-lg md:text-xl max-w-2xl mx-auto px-4">
                  {category.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Category Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Header (if no banner image) */}
        {!category.image_url && (
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {category.description}
              </p>
            )}
          </div>
        )}

        {/* Products Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            {products.length} product{products.length !== 1 ? 's' : ''} in {category.name}
          </p>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow w-[275px] h-[375px] flex flex-col">
                {/* Product Image */}
                <div className="relative flex-shrink-0 overflow-hidden bg-gray-100 rounded-t-lg" style={{ height: '200px' }}>
                  <img
                    src={getProductImage(product)}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                    }}
                  />
                  {product.compare_price && product.compare_price > product.price && (
                    <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-sm font-semibold">
                      {Math.round(((product.compare_price - product.price) / product.compare_price) * 100)}% OFF
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4 flex-1 flex flex-col justify-between overflow-hidden">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 overflow-hidden">
                      {product.name}
                    </h3>
                    
                    {/* Price */}
                    <div className="mb-3">
                      {product.compare_price && product.compare_price > product.price ? (
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-red-600">
                            {formatPrice(product.price)}
                          </span>
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(product.compare_price)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-gray-900">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* View Product Button */}
                  <a
                    href={`/product/${product.slug}`}
                    className="mt-auto block w-full bg-red-600 text-white text-center py-2 rounded hover:bg-red-700 transition-colors"
                  >
                    View Product
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">
              There are currently no products in the {category.name} category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
