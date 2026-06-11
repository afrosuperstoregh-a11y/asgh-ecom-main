'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, ShoppingCart, Plus, Minus } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { getProductImageUrl, PRODUCT_CARD_IMAGE_PROPS, getSafeImageUrl } from '../lib/images';
import { formatPrice } from '../lib/utils';

interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  compare_price?: number;
  image?: string;
  images?: string[];
  rating?: number;
  reviews?: number;
  inventory_quantity?: number;
  allow_backorder?: boolean;
  categories?: {
    name: string;
  };
}

interface FeaturedProductCardProps {
  product: Product;
}

function FeaturedProductCard({ product }: FeaturedProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState(false);
  const { addToCart } = useCart();
  
  const inStock = ((product.inventory_quantity || 0) > 0) || product.allow_backorder;
  const hasDiscount = product.compare_price && product.compare_price > product.price;
  
  // Increase quantity
  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };
  
  // Decrease quantity with minimum of 1
  const decreaseQuantity = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };
  
  // Add to cart with selected quantity
  const handleAddToCart = () => {
    // Add the item multiple times to achieve the desired quantity
    // since addToCart doesn't accept quantity parameter
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: getSafeImageUrl(getProductImageUrl(product.image || product.images?.[0]), '/placeholder-product.svg'),
        category: product.categories?.name
      });
    }
    
    // Reset quantity to 1 after adding to cart
    setQuantity(1);
  };
  
  return (
    <div className="group">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 w-full max-w-[275px] sm:w-[275px] aspect-[4/5] flex flex-col">
        {/* Product Image */}
        <Link href={`/product/${product.slug}`} className="block flex-shrink-0 w-full aspect-[4/3] sm:aspect-[16/9] overflow-hidden">
          <div className="relative w-full h-full overflow-hidden bg-gray-100 rounded-t-xl">
            <Image
              src={imageError ? '/placeholder-product.svg' : getSafeImageUrl(getProductImageUrl(product.image || product.images?.[0]), '/placeholder-product.svg')}
              alt={product.name}
              fill
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105 rounded-t-xl"
              {...PRODUCT_CARD_IMAGE_PROPS}
              priority={false}
              onError={() => {
                if (process.env.NODE_ENV === 'development') {
                  console.log('FeaturedProductCard - Image error for product:', product.name);
                }
                setImageError(true);
              }}
              onLoad={() => {
                if (process.env.NODE_ENV === 'development') {
                  console.log('FeaturedProductCard - Image loaded successfully for product:', product.name);
                }
              }}
            />
          </div>
        </Link>
        
        {/* Product Info */}
        <div className="p-4 flex-1 flex flex-col overflow-hidden">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2 truncate">
            {product.categories?.name || 'Premium'}
          </div>
          
          <div className="space-y-1 flex-1">
            <Link href={`/product/${product.slug}`} className="block">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 overflow-hidden">
                {product.name}
              </h3>
            </Link>
            
            {/* Rating - Visible on all screen sizes */}
            <div className="flex items-center gap-1 whitespace-nowrap">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 flex-shrink-0 ${
                      i < Math.floor(product.rating || 4.8)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500 flex-shrink-0">({product.reviews || 24})</span>
            </div>
            
            {/* Price */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-base font-bold text-gray-900">
                  {formatPrice(product.price)}
                </span>
                {hasDiscount && (
                  <span className="text-xs text-gray-500 line-through">
                    {formatPrice(product.compare_price || 0)}
                  </span>
                )}
              </div>
              {hasDiscount && (
                <span className="bg-red-100 text-red-800 text-xs font-medium px-1 py-0.5 rounded">
                  Sale
                </span>
              )}
            </div>
            
            {/* Stock Status - Hidden on mobile for cleaner layout */}
            <div className="text-xs sm:text-sm text-gray-600 hidden sm:block">
              {inStock ? (
                <span className="text-green-600">
                  {(product.inventory_quantity || 0) >= 10 ? `${product.inventory_quantity} in stock` : 'Available'}
                </span>
              ) : (
                <span className="text-red-600">Out of Stock</span>
              )}
            </div>
          </div>
          
          {/* Add to Cart Button */}
          <div className="mt-auto">
            {inStock ? (
              <button
                onClick={handleAddToCart}
                className="w-full bg-blue-600 text-white py-2.5 px-4 sm:py-2.5 sm:px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-sm sm:text-sm"
              >
                Add to Cart
              </button>
            ) : (
              <button
                disabled
                className="w-full bg-gray-300 text-gray-500 py-2.5 px-4 sm:py-2.5 sm:px-4 rounded-lg cursor-not-allowed font-medium text-sm sm:text-sm"
              >
                Out of Stock
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(FeaturedProductCard);
