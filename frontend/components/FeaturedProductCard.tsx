'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Star, ShoppingCart, Plus, Minus } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { fixImageUrl } from '../lib/supabase-storage';

interface Product {
  id: string;
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

export default function FeaturedProductCard({ product }: FeaturedProductCardProps) {
  const [quantity, setQuantity] = useState(1);
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
        image: fixImageUrl(product.image || product.images?.[0]),
        category: product.categories?.name
      });
    }
    
    // Reset quantity to 1 after adding to cart
    setQuantity(1);
  };
  
  return (
    <div className="group">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 w-[275px] h-[350px] flex flex-col">
        {/* Product Image */}
        <Link href={`/product/${product.id}`} className="block flex-shrink-0" style={{ height: '200px' }}>
          <div className="relative w-full h-full overflow-hidden bg-gray-100 rounded-t-xl">
            <img
              src={fixImageUrl(product.image || product.images?.[0])}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-t-xl"
              sizes="275px"
            />
          </div>
        </Link>
        
        {/* Product Info */}
        <div className="p-4 flex-1 flex flex-col justify-between overflow-hidden">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2 truncate">
            {product.categories?.name || 'Premium'}
          </div>
          
          <Link href={`/product/${product.id}`} className="block">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2 overflow-hidden">
              {product.name}
            </h3>
          </Link>
          
          {/* Rating */}
          <div className="flex items-center space-x-1 mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(product.rating || 0)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">({product.reviews || 0})</span>
          </div>
          
          {/* Price */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-1">
              <span className="text-sm font-bold text-gray-900">
                ${product.compare_price || product.price}
              </span>
              {product.compare_price && (
                <span className="text-xs text-gray-500 line-through">
                  ${product.price}
                </span>
              )}
            </div>
            {product.compare_price && (
              <span className="bg-red-100 text-red-800 text-xs font-medium px-1 py-0.5 rounded">
                Sale
              </span>
            )}
          </div>
          
          {/* Stock Status */}
          <div className="text-xs text-gray-600 mb-3 truncate">
            {inStock ? (
              <span className="text-green-600">
                {(product.inventory_quantity || 0) >= 10 ? `${product.inventory_quantity} in stock` : 'Available'}
              </span>
            ) : (
              <span className="text-red-600">Out of Stock</span>
            )}
          </div>
          
          {/* Add to Cart Button */}
          {inStock && (
            <button
              onClick={handleAddToCart}
              className="mt-auto w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-sm"
            >
              Add to Cart
            </button>
          )}
          
          {/* Out of Stock Message */}
          {!inStock && (
            <button
              disabled
              className="mt-auto w-full bg-gray-300 text-gray-500 py-2.5 px-4 rounded-lg cursor-not-allowed font-medium text-sm"
            >
              Out of Stock
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
