'use client';

import { useState, useEffect } from 'react';
import { Star, Heart, ShoppingCart, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  image?: string;
  rating?: number;
  reviews?: number;
  category?: string;
  inStock?: boolean;
}

interface ProductRecommendationsProps {
  className?: string;
  title?: string;
  subtitle?: string;
  type?: 'related' | 'trending' | 'recommended' | 'recently_viewed' | 'personalized';
  productId?: string;
  customerId?: string;
  limit?: number;
  showAddToCart?: boolean;
  showWishlist?: boolean;
  showRating?: boolean;
  columns?: number;
}

export default function ProductRecommendations({
  className = '',
  title,
  subtitle,
  type = 'related',
  productId,
  customerId,
  limit = 8,
  showAddToCart = true,
  showWishlist = true,
  showRating = true,
  columns = 4
}: ProductRecommendationsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Default titles based on type
  const getDefaultTitle = () => {
    switch (type) {
      case 'related':
        return 'You might also like';
      case 'trending':
        return 'Trending now';
      case 'recommended':
        return 'Recommended for you';
      case 'recently_viewed':
        return 'Recently viewed';
      case 'personalized':
        return 'Picked for you';
      default:
        return 'Recommended products';
    }
  };

  const displayTitle = title || getDefaultTitle();

  useEffect(() => {
    fetchRecommendations();
  }, [type, productId, customerId, limit]);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    setError('');

    try {
      let url = '/api/marketing/recommendations';
      const params = new URLSearchParams({
        type,
        limit: limit.toString()
      });

      if (productId) params.append('productId', productId);
      if (customerId) params.append('customerId', customerId);

      const response = await fetch(`${url}?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.products);
      } else {
        setError('Failed to load recommendations');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setError('Failed to load recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async (product: Product) => {
    try {
      const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1
        }),
      });

      if (response.ok) {
        // Trigger cart update event
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleAddToWishlist = async (product: Product) => {
    try {
      const response = await fetch('/api/wishlist/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id
        }),
      });

      if (response.ok) {
        // Trigger wishlist update event
        window.dispatchEvent(new CustomEvent('wishlistUpdated'));
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const renderRating = (rating: number, reviews: number) => {
    return (
      <div className="flex items-center gap-1">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < Math.floor(rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-gray-600">({reviews})</span>
      </div>
    );
  };

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6'
  }[columns] || 'grid-cols-4';

  if (isLoading) {
    return (
      <div className={`product-recommendations ${className}`}>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">{displayTitle}</h2>
          {subtitle && <p className="text-gray-600">{subtitle}</p>}
        </div>
        <div className={`grid ${gridCols} gap-4`}>
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 aspect-square rounded-lg mb-3"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || products.length === 0) {
    return null; // Don't show anything if there are no recommendations
  }

  return (
    <div className={`product-recommendations ${className}`}>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          {type === 'personalized' && (
            <Sparkles className="w-5 h-5 text-purple-600" />
          )}
          <h2 className="text-2xl font-bold">{displayTitle}</h2>
        </div>
        {subtitle && <p className="text-gray-600">{subtitle}</p>}
      </div>

      <div className={`grid ${gridCols} gap-4`}>
        {products.map((product) => (
          <div key={product.id} className="group">
            <div className="relative">
              {/* Product Image */}
              <Link href={`/products/${product.slug}`}>
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden group-hover:opacity-90 transition-opacity">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-2"></div>
                        <span className="text-sm">No image</span>
                      </div>
                    </div>
                  )}
                </div>
              </Link>

              {/* Quick Actions */}
              <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {showWishlist && (
                  <button
                    onClick={() => handleAddToWishlist(product)}
                    className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                    title="Add to wishlist"
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Out of Stock Badge */}
              {!product.inStock && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                  <span className="bg-white text-gray-900 px-3 py-1 rounded-md text-sm font-medium">
                    Out of Stock
                  </span>
                </div>
              )}

              {/* Discount Badge */}
              {product.comparePrice && product.comparePrice > product.price && (
                <div className="absolute top-2 left-2">
                  <span className="bg-red-600 text-white px-2 py-1 rounded-md text-xs font-medium">
                    {Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}% OFF
                  </span>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="mt-3">
              {/* Category */}
              {product.category && (
                <p className="text-xs text-gray-500 mb-1">{product.category}</p>
              )}

              {/* Product Name */}
              <Link href={`/products/${product.slug}`}>
                <h3 className="font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
                  {product.name}
                </h3>
              </Link>

              {/* Rating */}
              {showRating && product.rating && (
                <div className="mt-1">
                  {renderRating(product.rating, product.reviews || 0)}
                </div>
              )}

              {/* Price */}
              <div className="mt-2 flex items-center gap-2">
                <span className="font-bold text-lg">{formatPrice(product.price)}</span>
                {product.comparePrice && product.comparePrice > product.price && (
                  <span className="text-gray-500 line-through text-sm">
                    {formatPrice(product.comparePrice)}
                  </span>
                )}
              </div>

              {/* Add to Cart Button */}
              {showAddToCart && product.inStock && (
                <button
                  onClick={() => handleAddToCart(product)}
                  className="mt-3 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* View All Link */}
      <div className="mt-8 text-center">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          View all products
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
