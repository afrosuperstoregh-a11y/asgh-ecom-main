'use client';

import Image from 'next/image';
import { Product } from '@/types/product';
import { Heart, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { fixImageUrl } from '../lib/supabase-storage';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  const isWishlisted = isInWishlist(product.id.toString());
  const hasDiscount = product.compare_price && product.compare_price > product.price;
  const inStock = product.inventory_quantity > 0 || product.allow_backorder;

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: fixImageUrl(product.image_url || product.images?.[0])
    });
    
    // Visual feedback - briefly change cart icon color
    const cartIcon = document.querySelector(`[data-cart-id="${product.id}"]`);
    if (cartIcon) {
      cartIcon.classList.add('text-green-600');
      setTimeout(() => {
        cartIcon.classList.remove('text-green-600');
      }, 300);
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
        image: fixImageUrl(product.image_url || product.images?.[0])
      });
    }
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden w-[275px] h-[350px] flex flex-col"
    >
      {/* Product Image */}
      <div className="relative flex-shrink-0 overflow-hidden bg-gray-100 rounded-t-xl" style={{ height: '200px' }}>
        <Image
          src={fixImageUrl(product.image_url || product.images?.[0])}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105 rounded-t-xl"
          sizes="275px"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-product.jpg';
          }}
        />
        
        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
            {Math.round(((product.compare_price! - product.price) / product.compare_price!) * 100)}% OFF
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute top-2 right-2 p-2 rounded-full transition-colors ${
            isWishlisted 
              ? 'bg-red-500 text-white' 
              : 'bg-white text-gray-600 hover:text-red-500'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Quick Add to Cart */}
        <button
          onClick={handleAddToCart}
          disabled={!inStock}
          aria-label={inStock ? 'Add product to cart' : 'Product out of stock'}
          data-cart-id={product.id}
          className={`absolute bottom-2 right-2 p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-colors z-10 ${
            !inStock ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <ShoppingCart className={`w-4 h-4 ${!inStock ? 'text-gray-400' : 'text-gray-700'}`} />
        </button>
      </div>

      {/* Product Info */}
      <div className="p-4 flex-1 flex flex-col justify-between overflow-hidden">
        {/* Category */}
        {product.category_name && (
          <p className="text-xs text-gray-500 mb-2 truncate">{product.category_name}</p>
        )}

        {/* Product Name */}
        <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer overflow-hidden">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base font-bold text-gray-900">
            ${product.price.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-500 line-through">
              ${product.compare_price?.toFixed(2)}
            </span>
          )}
        </div>

        {/* Stock Status */}
        <div className="text-xs text-gray-600 mb-3">
          {inStock ? (
            <span className="text-green-600">
              {product.inventory_quantity >= 10 ? `${product.inventory_quantity} in stock` : 'Available'}
            </span>
          ) : (
            <span className="text-red-600">Out of Stock</span>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={!inStock}
          className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-colors ${
            inStock
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {inStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}
