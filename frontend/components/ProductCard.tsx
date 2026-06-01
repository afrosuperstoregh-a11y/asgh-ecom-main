'use client';

import React from 'react';
import Image from 'next/image';
import { useState } from 'react';
import { Product } from '@/types/product';
import { Heart, ShoppingCart, Star, Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { getProductImageUrl, handleImageError, PRODUCT_CARD_IMAGE_PROPS } from '../lib/images';
import { formatPrice } from '../lib/utils';
import { Button } from './ui/Button';

interface ProductCardProps {
  product: Product;
  showQuantitySelector?: boolean;
}

function ProductCard({ product, showQuantitySelector = false }: ProductCardProps) {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const isWishlisted = isInWishlist(product.id.toString());
  const hasDiscount = product.compare_price && product.compare_price > product.price;
  const inStock = product.inventory_quantity > 0 || product.allow_backorder;

  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };
  
  const decreaseQuantity = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };

  const handleAddToCart = () => {
    // Add the item multiple times to achieve the desired quantity
    // since addToCart doesn't accept quantity parameter
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: getProductImageUrl(product.image_url || product.images?.[0])
      });
    }
    
    // Reset quantity to 1 after adding to cart if quantity selector is shown
    if (showQuantitySelector) {
      setQuantity(1);
    }
  };

  const handleWishlist = () => {
    if (isWishlisted) {
      removeFromWishlist(product.id.toString());
    } else {
      addToWishlist({
        id: product.id.toString(),
        name: product.name,
        price: product.price,
        image: getProductImageUrl(product.image_url || product.images?.[0])
      });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden w-full aspect-[4/5] flex flex-col">
      {/* Product Image */}
      <div className="relative flex-shrink-0 overflow-hidden bg-gray-100 rounded-t-xl w-full aspect-[4/3] sm:aspect-[16/9]">
        <Image
          src={imageError ? getProductImageUrl(null) : getProductImageUrl(product.image_url || product.images?.[0] || product.image)}
          alt={product.name}
          fill
          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105 rounded-t-xl"
          {...PRODUCT_CARD_IMAGE_PROPS}
          priority={false}
          onError={() => setImageError(true)}
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
        />
        
        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
            {Math.round(((product.compare_price! - product.price) / product.compare_price!) * 100)}% OFF
          </div>
        )}

        {/* Wishlist Button */}
        <Button
          onClick={handleWishlist}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          variant="ghost"
          size="icon"
          className={`absolute top-2 right-2 p-3 sm:p-2 rounded-full transition-colors ${
            isWishlisted 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-white text-gray-600 hover:text-red-500'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </Button>

        {/* Quick Add to Cart */}
        <Button
          onClick={handleAddToCart}
          disabled={!inStock}
          aria-label={inStock ? 'Add product to cart' : 'Product out of stock'}
          data-cart-id={product.id}
          variant="secondary"
          size="icon"
          className={`absolute bottom-2 right-2 p-3 sm:p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-colors z-10 ${
            !inStock ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <ShoppingCart className={`w-4 h-4 ${!inStock ? 'text-gray-400' : 'text-gray-700'}`} />
        </Button>
      </div>

      {/* Product Info */}
      <div className="p-4 flex-1 flex flex-col overflow-hidden">
        {/* Category */}
        {product.category_name && (
          <p className="text-xs text-gray-500 mb-2 truncate">{product.category_name}</p>
        )}

        <div className="space-y-2 flex-1">
          {/* Product Name */}
          <h3 className="text-sm sm:text-base font-medium text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer overflow-hidden">
            {product.name}
          </h3>

          {/* Star Rating - Hidden on mobile for cleaner layout */}
          <div className="flex items-center gap-1 whitespace-nowrap hidden sm:block">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 flex-shrink-0 ${
                    i < Math.floor(product.rating || 0)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0">({product.reviews || 0})</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-500 line-through">
                {formatPrice(product.compare_price || 0)}
              </span>
            )}
          </div>

          {/* Stock Status */}
          <div className="text-xs sm:text-sm text-gray-600">
            {inStock ? (
              <span className="text-green-600">
                {product.inventory_quantity >= 10 ? `${product.inventory_quantity} in stock` : 'Available'}
              </span>
            ) : (
              <span className="text-red-600">Out of Stock</span>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        <div className="mt-auto">
          {showQuantitySelector ? (
            <div className="space-y-2">
              {/* Quantity Selector */}
              <div className="flex items-center gap-2">
                <button
                  onClick={decreaseQuantity}
                  className="p-1 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <button
                  onClick={increaseQuantity}
                  className="p-1 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {/* Add to Cart Button */}
              <Button
                onClick={handleAddToCart}
                disabled={!inStock}
                variant={inStock ? "primary" : "secondary"}
                size="md"
                className="w-full py-2.5 px-4 sm:py-2.5 sm:px-4 rounded-lg font-medium text-sm sm:text-sm transition-colors"
              >
                {inStock ? `Add to Cart (${quantity})` : 'Out of Stock'}
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleAddToCart}
              disabled={!inStock}
              variant={inStock ? "primary" : "secondary"}
              size="md"
              className="w-full py-2.5 px-4 sm:py-2.5 sm:px-4 rounded-lg font-medium text-sm sm:text-sm transition-colors"
            >
              {inStock ? 'Add to Cart' : 'Out of Stock'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(ProductCard);
