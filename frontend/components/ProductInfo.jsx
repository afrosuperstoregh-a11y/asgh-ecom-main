'use client';

import { useState } from 'react';
import { ShoppingCart, Heart, Truck, Shield, RefreshCw, Star, Minus, Plus } from 'lucide-react';

export default function ProductInfo({ product }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({
    color: null,
    size: null,
  });

  // Handle missing variants data gracefully
  const variants = product.variants || { colors: null, sizes: null };
  
  const handleQuantityChange = (change) => {
    setQuantity((prev) => Math.max(1, prev + change));
  };

  const handleOptionChange = (type, option) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [type]: option,
    }));
  };

  const handleAddToCart = () => {
    console.log('Added to cart:', {
      productId: product.id,
      quantity,
      selectedOptions,
    });
  };

  const handleBuyNow = () => {
    console.log('Buy now:', {
      productId: product.id,
      quantity,
      selectedOptions,
    });
  };

  const handleWishlist = () => {
    console.log('Added to wishlist:', product.id);
  };

  const renderStars = (rating) => {
    const ratingValue = rating || 0;
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(ratingValue) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Product Title and Brand */}
      <div>
        {product.brand && (
          <p className="text-sm text-gray-600 uppercase tracking-wide">{product.brand}</p>
        )}
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mt-1">{product.name}</h1>
        <p className="text-sm text-gray-500 mt-1">SKU: {product.sku || 'N/A'}</p>
      </div>

      {/* Product Description */}
      {product.description && (
        <div>
          <p className="text-gray-600 leading-relaxed">{product.description}</p>
        </div>
      )}

      {/* Rating and Reviews */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          {renderStars(product.rating)}
        </div>
        <span className="text-sm text-gray-600">{product.rating || 0} out of 5</span>
        <span className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer">
          ({product.reviews || 0} reviews)
        </span>
      </div>

      {/* Price */}
      <div className="flex items-center space-x-3">
        <span className="text-3xl font-bold text-gray-900">${product.price}</span>
        {product.compare_price && (
          <>
            <span className="text-lg text-gray-500 line-through">${product.compare_price}</span>
            <span className="bg-red-100 text-red-800 text-sm font-medium px-2 py-1 rounded">
              {Math.round(((product.compare_price - product.price) / product.compare_price) * 100)}% OFF
            </span>
          </>
        )}
      </div>

      {/* Stock Status */}
      <div className="flex items-center space-x-2">
        <div className={`h-2 w-2 rounded-full ${product.inventory_quantity > 0 || product.allow_backorder ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className={`text-sm font-medium ${product.inventory_quantity > 0 || product.allow_backorder ? 'text-green-700' : 'text-red-700'}`}>
          {product.inventory_quantity > 0 ? 'In Stock' : product.allow_backorder ? 'Backorder Available' : 'Out of Stock'}
        </span>
        {product.inventory_quantity > 0 && (
          <span className="text-sm text-gray-500">({product.inventory_quantity} available)</span>
        )}
      </div>

      {/* Variant Selection */}
      {variants.colors && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Select Options</h3>
          <div className="space-y-4">
            {variants.colors && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="flex space-x-2">
                  {variants.colors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => handleOptionChange('color', color)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        selectedOptions.color?.value === color.value
                          ? 'border-blue-600 ring-2 ring-blue-200'
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {variants.sizes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                <div className="flex space-x-2">
                  {variants.sizes.map((size) => (
                    <button
                      key={size.value}
                      onClick={() => handleOptionChange('size', size)}
                      className={`px-3 py-1 rounded border ${
                        selectedOptions.size?.value === size.value
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-gray-300 text-gray-700'
                      }`}
                    >
                      {size.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quantity Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleQuantityChange(-1)}
            className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            disabled={quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-12 text-center font-medium">{quantity}</span>
          <button
            onClick={() => handleQuantityChange(1)}
            className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleAddToCart}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          <ShoppingCart className="h-5 w-5" />
          <span>Add to Cart</span>
        </button>
        
        <button
          onClick={handleBuyNow}
          className="w-full bg-gray-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Buy Now
        </button>
        
        <button
          onClick={handleWishlist}
          className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
        >
          <Heart className="h-5 w-5" />
          <span>Add to Wishlist</span>
        </button>
      </div>

      {/* Trust Badges */}
      <div className="border-t border-gray-200 pt-6 space-y-3">
        <div className="flex items-center space-x-3 text-sm text-gray-600">
          <Truck className="h-5 w-5 text-blue-600" />
          <span>Free delivery on orders over $50</span>
        </div>
        <div className="flex items-center space-x-3 text-sm text-gray-600">
          <Shield className="h-5 w-5 text-blue-600" />
          <span>Secure checkout with SSL encryption</span>
        </div>
        <div className="flex items-center space-x-3 text-sm text-gray-600">
          <RefreshCw className="h-5 w-5 text-blue-600" />
          <span>30-day easy returns</span>
        </div>
      </div>

      {/* Product Highlights */}
      {product.highlights && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Key Features</h3>
          <ul className="space-y-2">
            {product.highlights.map((highlight, index) => (
              <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                <div className="h-5 w-5 text-blue-600 mt-0.5">✓</div>
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
