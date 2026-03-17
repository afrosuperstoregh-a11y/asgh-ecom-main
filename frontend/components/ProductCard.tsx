'use client';

import Image from 'next/image';
import { Product } from '@/types/product';
import { Heart, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

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
      image: product.image_url || product.images?.[0] || '/placeholder-product.jpg'
    });
  };

  const handleWishlist = () => {
    if (isWishlisted) {
      removeFromWishlist(product.id.toString());
    } else {
      addToWishlist({
        id: product.id.toString(),
        name: product.name,
        price: product.price,
        image: product.image_url || product.images?.[0] || '/placeholder-product.jpg'
      });
    }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden w-[250px] h-[250px] flex flex-col"
    >
      {/* Product Image */}
      <div className="relative flex-shrink-0 overflow-hidden bg-gray-100" style={{ height: '150px' }}>
        <Image
          src={product.image_url || product.images?.[0] || '/placeholder-product.jpg'}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="250px"
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
          className={`absolute bottom-2 right-2 p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-colors z-10 ${
            !inStock ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <ShoppingCart className={`w-4 h-4 ${!inStock ? 'text-gray-400' : 'text-gray-700'}`} />
        </button>
      </div>

      {/* Product Info */}
      <div className="p-3 flex-1 flex flex-col justify-between overflow-hidden">
        {/* Category */}
        {product.category_name && (
          <p className="text-xs text-gray-500 mb-0.5 truncate">{product.category_name}</p>
        )}

        {/* Product Name */}
        <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer overflow-hidden">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-center gap-2 mb-1">
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
        <div className="text-xs text-gray-600">
          {inStock ? (
            <span className="text-green-600">
              {product.inventory_quantity >= 10 ? `${product.inventory_quantity} in stock` : 'Available'}
            </span>
          ) : (
            <span className="text-red-600">Out of Stock</span>
          )}
        </div>
      </div>
    </div>
  );
}
