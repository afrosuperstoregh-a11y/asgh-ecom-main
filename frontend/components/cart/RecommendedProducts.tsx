'use client';

import Image from 'next/image';
import { Plus, Star } from 'lucide-react';
import { getSafeImageUrl } from '../../lib/images';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
}

interface RecommendedProductsProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export default function RecommendedProducts({ products, onAddToCart }: RecommendedProductsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">You might also like</h2>
      
      {/* Horizontal Scroll Container */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max sm:min-w-0 sm:grid sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="w-64 sm:w-auto bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200"
            >
              {/* Product Image */}
              <div className="relative w-full h-48 bg-gray-100">
                <Image
                  src={getSafeImageUrl(product.image, '/placeholder-product.svg')}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 256px, (max-width: 1024px) 50vw, 25vw"
                />
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">
                  {product.name}
                </h3>
                
                {/* Rating */}
                <div className="flex items-center gap-1 mb-3">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">(4.0)</span>
                </div>

                {/* Price and Add to Cart */}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">
                    ${product.price.toFixed(2)}
                  </span>
                  <button
                    onClick={() => onAddToCart(product)}
                    className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* View All Products Link */}
      <div className="mt-6 text-center">
        <a
          href="/products"
          className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium transition-colors duration-200"
        >
          View all products
          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  );
}
