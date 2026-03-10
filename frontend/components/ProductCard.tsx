'use client';

import { useState } from 'react';
import { Product } from '@/lib/api/products';
import { Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
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
      image: product.images?.[0] || '/placeholder-product.jpg'
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
        image: product.images?.[0] || '/placeholder-product.jpg'
      });
    }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.images && product.images.length > 0 ? product.images[0] : '/placeholder-product.jpg'}
          alt={product.name}
          className="w-full h-full object-cover"
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
          className={`absolute top-2 right-2 p-2 rounded-full transition-colors ${
            isWishlisted 
              ? 'bg-red-500 text-white' 
              : 'bg-white text-gray-600 hover:text-red-500'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Quick Add to Cart on Hover */}
        {isHovered && (
          <div className="absolute bottom-2 left-2 right-2">
            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className={`w-full py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                inStock
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {inStock ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Category */}
        {product.category_name && (
          <p className="text-xs text-gray-500 mb-1">{product.category_name}</p>
        )}

        {/* Product Name */}
        <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg font-bold text-gray-900">
            ${product.price.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-500 line-through">
              ${product.compare_price?.toFixed(2)}
            </span>
          )}
        </div>

        {/* Stock Status */}
        <div className="text-xs text-gray-600">
          {inStock ? (
            <span className="text-green-600">
              {product.inventory_quantity > 0 ? `${product.inventory_quantity} in stock` : 'Available'}
            </span>
          ) : (
            <span className="text-red-600">Out of Stock</span>
          )}
        </div>
      </div>
    </div>
  );
}
        id: product.id.toString(),
        name: product.name,
        price: product.discountPrice || product.price,
        image: product.images[0],
        category: product.category
      });
      
      // Show success feedback briefly
      setTimeout(() => {
        setIsAddingToCart(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      setIsAddingToCart(false);
      // You could add a toast notification here
    }
  };

  const handleWishlist = async () => {
    try {
      const productId = product.id.toString();
      if (isWishlisted) {
        await removeFromWishlist(productId);
      } else {
        await addToWishlist({
          id: productId,
          name: product.name,
          price: product.discountPrice || product.price,
          image: product.images[0],
          category: product.category
        });
      }
    } catch (error) {
      console.error('Failed to update wishlist:', error);
      // You could add a toast notification here
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Star key="half" className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
      );
    }

    return stars;
  };

  const getColorClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      'black': 'bg-black',
      'white': 'bg-white border border-gray-300',
      'gray': 'bg-gray-500',
      'navy': 'bg-blue-900',
      'blue': 'bg-blue-500',
      'red': 'bg-red-500',
      'green': 'bg-green-500',
      'pink': 'bg-pink-500',
      'purple': 'bg-purple-500',
      'brown': 'bg-amber-800',
      'tan': 'bg-yellow-700',
      'silver': 'bg-gray-400',
      'gold': 'bg-yellow-500',
      'light-wash': 'bg-blue-200',
      'tortoise': 'bg-amber-700',
      'rose-gold': 'bg-pink-300',
      'olive': 'bg-green-700'
    };
    return colorMap[color] || 'bg-gray-400';
  };

  return (
    <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300">
      {/* Product Images */}
      <div 
        className="relative overflow-hidden rounded-t-lg cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img
          src={isHovered && product.images[1] ? product.images[1] : product.images[0]}
          alt={product.name}
          className="w-full h-48 sm:h-64 md:h-80 object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.tags.includes('new') && (
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
              NEW
            </span>
          )}
          {product.tags.includes('sale') && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
              SALE
            </span>
          )}
          {!product.inStock && (
            <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded-full font-semibold">
              OUT OF STOCK
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          className="absolute top-2 right-2 p-2 sm:p-3 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow duration-200 touch-target"
        >
          <Heart 
            className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors duration-200 ${
              isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600 hover:text-red-500'
            }`}
          />
        </button>
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Brand */}
        <p className="text-sm text-gray-500 font-medium mb-1">{product.brand}</p>
        
        {/* Product Name */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center">
            {renderStars(product.rating)}
          </div>
          <span className="text-sm text-gray-500">
            ({product.reviewCount})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl font-bold text-gray-900">
            ${product.discountPrice || product.price}
          </span>
          {product.discountPrice && (
            <span className="text-sm text-gray-500 line-through">
              ${product.price}
            </span>
          )}
          {product.discountPrice && (
            <span className="text-sm text-red-500 font-semibold">
              {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
            </span>
          )}
        </div>

        {/* Color Swatches */}
        {product.colors.length > 1 && (
          <div className="mb-3">
            <div className="flex items-center gap-1">
              {product.colors.slice(0, 4).map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-6 h-6 rounded-full ${getColorClass(color)} ${
                    selectedColor === color ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                  } transition-all duration-200`}
                  title={color}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-xs text-gray-500 ml-1">
                  +{product.colors.length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Size Options */}
        {product.sizes.length > 1 && product.sizes[0] !== 'one-size' && (
          <div className="mb-4">
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {product.sizes.map((size) => (
                <option key={size} value={size}>
                  Size {size}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={!product.inStock || isAddingToCart}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base touch-target ${
            !product.inStock
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : isAddingToCart
              ? 'bg-green-500 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isAddingToCart ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Added!
            </>
          ) : !product.inStock ? (
            'Out of Stock'
          ) : (
            <>
              <ShoppingCart className="h-5 w-5" />
              Add to Cart
            </>
          )}
        </button>
      </div>
    </div>
  );
}
