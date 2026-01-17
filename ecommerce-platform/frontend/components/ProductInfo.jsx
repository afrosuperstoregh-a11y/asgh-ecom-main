'use client';

import { useState } from 'react';
import { ShoppingCart, Heart, Truck, Shield, RefreshCw, Star, Minus, Plus } from 'lucide-react';

export default function ProductInfo({ product }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({
    color: product.variants.colors?.[0] || null,
    size: product.variants.sizes?.[0] || null,
  });

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
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Product Title and Brand */}
      <div>
        <p className="text-sm text-gray-600 uppercase tracking-wide">{product.brand}</p>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mt-1">{product.name}</h1>
        <p className="text-sm text-gray-500 mt-1">SKU: {product.sku}</p>
      </div>

      {/* Rating and Reviews */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          {renderStars(product.rating)}
        </div>
        <span className="text-sm text-gray-600">{product.rating} out of 5</span>
        <span className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer">
          ({product.reviews} reviews)
        </span>
      </div>

      {/* Price */}
      <div className="flex items-center space-x-3">
        <span className="text-3xl font-bold text-gray-900">${product.price}</span>
        {product.originalPrice && (
          <>
            <span className="text-lg text-gray-500 line-through">${product.originalPrice}</span>
            <span className="bg-red-100 text-red-800 text-sm font-medium px-2 py-1 rounded">
              {product.discount}% OFF
            </span>
          </>
        )}
      </div>

      {/* Stock Status */}
      <div className="flex items-center space-x-2">
        <div className={`h-2 w-2 rounded-full ${product.stockStatus === 'In Stock' ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className={`text-sm font-medium ${product.stockStatus === 'In Stock' ? 'text-green-700' : 'text-red-700'}`}>
          {product.stockStatus}
        </span>
        {product.stock && (
          <span className="text-sm text-gray-500">({product.stock} available)</span>
        )}
      </div>

      {/* Variant Selection */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Select Options</h3>
        {/* VariantSelector component would go here */}
        <div className="space-y-4">
          {product.variants.colors && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <div className="flex space-x-2">
                {product.variants.colors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleOptionChange('color', color)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      selectedOptions.color?.value === color.value
                        ? 'border-primary-600 ring-2 ring-primary-200'
                        : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          )}

          {product.variants.sizes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
              <div className="flex space-x-2">
                {product.variants.sizes.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => handleOptionChange('size', size)}
                    className={`px-3 py-1 rounded border ${
                      selectedOptions.size?.value === size.value
                        ? 'border-primary-600 bg-primary-50 text-primary-600'
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
          className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
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
          <Truck className="h-5 w-5 text-primary-600" />
          <span>Free delivery on orders over $50</span>
        </div>
        <div className="flex items-center space-x-3 text-sm text-gray-600">
          <Shield className="h-5 w-5 text-primary-600" />
          <span>Secure checkout with SSL encryption</span>
        </div>
        <div className="flex items-center space-x-3 text-sm text-gray-600">
          <RefreshCw className="h-5 w-5 text-primary-600" />
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
                <div className="h-5 w-5 text-primary-600 mt-0.5">✓</div>
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
