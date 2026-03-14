'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Star, ShoppingCart, Plus, Minus } from 'lucide-react';
import { useCart } from '@/context/CartContext';

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
        image: product.image || product.images?.[0] || '/placeholder-product.jpg',
        category: product.categories?.name
      });
    }
    
    // Reset quantity to 1 after adding to cart
    setQuantity(1);
  };
  
  return (
    <div className="group">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
        {/* Product Image */}
        <Link href={`/product/${product.id}`} className="block">
          <div className="aspect-square bg-gray-100 overflow-hidden">
            <img
              src={product.image || product.images?.[0] || '/placeholder-product.svg'}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>
        
        {/* Product Info */}
        <div className="p-4 md:p-6">
          <div className="text-sm text-gray-500 uppercase tracking-wide mb-2">
            {product.categories?.name || 'Premium'}
          </div>
          
          <Link href={`/product/${product.id}`} className="block">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
              {product.name}
            </h3>
          </Link>
          
          {/* Rating */}
          <div className="flex items-center space-x-1 mb-3">
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
            <span className="text-sm text-gray-500">({product.reviews || 0})</span>
          </div>
          
          {/* Price */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-xl md:text-2xl font-bold text-gray-900">
                ${product.compare_price || product.price}
              </span>
              {product.compare_price && (
                <span className="text-sm text-gray-500 line-through">
                  ${product.price}
                </span>
              )}
            </div>
            {product.compare_price && (
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">
                Sale
              </span>
            )}
          </div>
          
          {/* Stock Status */}
          <div className="text-xs text-gray-600 mb-4">
            {inStock ? (
              <span className="text-green-600">
                {(product.inventory_quantity || 0) >= 10 ? `${product.inventory_quantity} in stock` : 'Available'}
              </span>
            ) : (
              <span className="text-red-600">Out of Stock</span>
            )}
          </div>
          
          {/* Quantity Selector and Add to Cart */}
          {inStock && (
            <div className="space-y-3">
              {/* Quantity Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Quantity:</span>
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1}
                    className="p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-3 py-2 text-sm font-medium text-gray-900 min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={increaseQuantity}
                    className="p-2 text-gray-600 hover:bg-gray-100"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2 font-medium"
              >
                <ShoppingCart className="h-5 w-5" />
                Add to Cart
              </button>
            </div>
          )}
          
          {/* Out of Stock Message */}
          {!inStock && (
            <button
              disabled
              className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-lg cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            >
              <ShoppingCart className="h-5 w-5" />
              Out of Stock
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
