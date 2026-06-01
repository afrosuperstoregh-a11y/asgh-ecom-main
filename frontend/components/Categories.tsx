'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getCategoryImageUrl, CATEGORY_CARD_IMAGE_PROPS } from '../lib/images';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  image?: string;
  product_count?: number;
  productCount?: number;
  count?: number;
}

interface CategoriesProps {
  categories?: Category[];
}


// Skeleton loader component
const CategorySkeleton = () => (
  <div className="bg-gray-200 rounded-lg h-64 animate-pulse"></div>
);

export default function Categories({ categories: propCategories }: CategoriesProps) {
  const [categories, setCategories] = useState<Category[]>(propCategories || []);
  const [loading, setLoading] = useState(!propCategories);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If categories are passed as props, don't fetch
    if (propCategories) {
      return;
    }

    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch("/api/categories");
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
          setCategories(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch categories');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [propCategories]);

  if (loading) {
    return (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(20)].map((_, index) => (
              <CategorySkeleton key={index} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Categories</h2>
          <div className="text-center py-8">
            <p className="text-red-500 text-lg mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Categories</h2>
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">No categories available at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="categories" className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">Featured Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.filter(category => category && category.id).map((category) => (
            <div key={category.id} className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow">
                <Image
                  src={getCategoryImageUrl(category.image_url || category.image)}
                  alt={String(category.name) || 'Category'}
                  fill
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  {...CATEGORY_CARD_IMAGE_PROPS}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-category.svg';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-opacity"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="text-xl font-semibold mb-1">{String(category.name) || 'Unnamed Category'}</h3>
                  <p className="text-sm opacity-90">
                    {String(category.product_count || category.productCount || category.count || 0)} products
                  </p>
                </div>
              </div>
              {category.description && (
                <p className="mt-2 text-gray-600 text-sm">{String(category.description)}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
