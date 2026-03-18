'use client';

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Product } from '@/lib/api/products';
import { Button } from '@/components/ui/Button';
import { fixImageUrl } from '@/lib/supabase-storage';

interface ProductCardProps {
  product: Product;
  onBuyNow: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onBuyNow }) => {
  const hasDiscount = product.compare_price && product.compare_price > product.price;
  const discountPercentage = hasDiscount 
    ? Math.round(((product.compare_price! - product.price) / product.compare_price!) * 100)
    : 0;

  const inStock = product.inventory_quantity > 0 || product.allow_backorder;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group w-[275px] h-[350px] flex flex-col">
      {/* Product Image */}
      <div className="relative overflow-hidden bg-gray-100 flex-shrink-0" style={{ height: '200px' }}>
        <img
          src={fixImageUrl(product.images && product.images.length > 0 ? product.images[0] : undefined)}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="275px"
        />
        
        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded-md text-sm font-semibold">
            -{discountPercentage}%
          </div>
        )}

        {/* Out of Stock Badge */}
        {!inStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-white text-gray-800 px-3 py-1 rounded-md text-sm font-semibold">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3 flex-1 flex flex-col justify-between overflow-hidden">
        {/* Category */}
        {product.category_name && (
          <div className="mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wide truncate">{product.category_name}</span>
          </div>
        )}

        {/* Product Name */}
        <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer overflow-hidden">
          {product.name}
        </h3>

        {/* Short Description */}
        {product.short_description && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-2 overflow-hidden">
            {product.short_description}
          </p>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-bold text-gray-900">
            ${product.price.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-500 line-through">
              ${product.compare_price?.toFixed(2)}
            </span>
          )}
        </div>

        {/* Stock Status */}
        <div className="text-xs text-gray-600 mb-3 truncate">
          {inStock ? (
            <span className="text-green-600">
              {product.inventory_quantity > 0 ? `${product.inventory_quantity} in stock` : 'Available'}
            </span>
          ) : (
            <span className="text-red-600">Out of Stock</span>
          )}
        </div>

        {/* Quick Add to Cart */}
        <button
          onClick={() => onBuyNow(product.id)}
          disabled={!inStock}
          className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-colors z-10"
          aria-label="Add to cart"
        >
          <ShoppingCart className={`w-4 h-4 ${!inStock ? 'text-gray-400' : 'text-gray-700'}`} />
        </button>

        {/* Buy Now Button */}
        <Button
          size="sm"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
          onClick={() => onBuyNow(product.id)}
          disabled={!inStock}
        >
          {inStock ? 'Add to Cart' : 'Out of Stock'}
        </Button>
      </div>
    </div>
  );
};
