'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Heart, Truck, Shield, RefreshCw, Star, Minus, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/navigation';

export default function ProductInfo({ product }) {
  const { addToCart } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({
    color: null,
    size: null,
  });
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);

  // Handle missing variants data gracefully
  const variants = product.variants || { colors: null, sizes: null };
  
  // Sticky bar scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const productInfoElement = document.getElementById('product-info');
      
      if (productInfoElement) {
        const rect = productInfoElement.getBoundingClientRect();
        const isOutOfView = rect.bottom < 100;
        setShowStickyBar(isOutOfView && window.innerWidth < 768);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const handleQuantityChange = (change) => {
    setQuantity((prev) => Math.max(1, prev + change));
  };

  const handleOptionChange = (type, option) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [type]: option,
    }));
  };

  const handleAddToCart = async () => {
    if (!product || isAddingToCart) return;
    
    try {
      setIsAddingToCart(true);
      
      await addToCart({
        id: product.id.toString(),
        name: product.name,
        price: product.compare_price || product.price,
        image: product.image_url || product.image || '/placeholder-product.svg',
        category: product.categories?.name || 'Uncategorized'
      });
      
      // Optional: Show success message
      setTimeout(() => setIsAddingToCart(false), 1000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    
    try {
      // Add to cart first
      await addToCart({
        id: product.id.toString(),
        name: product.name,
        price: product.compare_price || product.price,
        image: product.image_url || product.image || '/placeholder-product.svg',
        category: product.categories?.name || 'Uncategorized'
      });
      
      // Redirect to checkout
      router.push('/checkout');
    } catch (error) {
      console.error('Failed to process buy now:', error);
    }
  };

  const handleWishlist = async () => {
    if (!product || isAddingToWishlist) return;
    
    try {
      setIsAddingToWishlist(true);
      
      // Get existing wishlist from localStorage
      const existingWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      
      // Check if product is already in wishlist
      if (!existingWishlist.find((item) => item.id === product.id)) {
        // Add to wishlist
        const wishlistItem = {
          id: product.id,
          name: product.name,
          price: product.compare_price || product.price,
          image: product.image_url || product.image || '/placeholder-product.svg',
          category: product.categories?.name || 'Uncategorized',
          addedAt: new Date().toISOString()
        };
        
        existingWishlist.push(wishlistItem);
        localStorage.setItem('wishlist', JSON.stringify(existingWishlist));
        
        // Optional: Show success message
        setTimeout(() => setIsAddingToWishlist(false), 1000);
      } else {
        setIsAddingToWishlist(false);
      }
    } catch (error) {
      console.error('Failed to add to wishlist:', error);
      setIsAddingToWishlist(false);
    }
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
    <>
      {/* Mobile Sticky Action Bar */}
      {showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 md:hidden">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-gray-900">${product.price}</span>
                  {product.compare_price && (
                    <span className="text-sm text-gray-500 line-through">${product.compare_price}</span>
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  {product.inventory_quantity > 0 || product.allow_backorder ? (
                    <span className="text-xs text-green-600 font-medium">
                      {product.inventory_quantity > 0 ? 'In Stock' : 'Backorder'}
                    </span>
                  ) : (
                    <span className="text-xs text-red-600 font-medium">Out of Stock</span>
                  )}
                </div>
              </div>
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 ml-4 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!(product.inventory_quantity > 0 || product.allow_backorder) || isAddingToCart}
              >
                <ShoppingCart className="h-4 w-4" />
                <span>{isAddingToCart ? 'Adding...' : 'Add to Cart'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div id="product-info" className="space-y-8">
      {/* GROUP 1: PRIMARY INFO */}
      <div className="space-y-3">
        {/* Product Title and Brand */}
        <div>
          {product.brand && (
            <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">{product.brand}</p>
          )}
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 leading-tight">{product.name}</h1>
          <p className="text-xs text-gray-500 mt-1">SKU: {product.sku || 'N/A'}</p>
        </div>

        {/* Rating and Reviews */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            {renderStars(product.rating)}
          </div>
          <span className="text-sm text-gray-600">{product.rating || 0} out of 5</span>
          <span className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer transition-colors">
            ({product.reviews || 0} reviews)
          </span>
        </div>
      </div>

      {/* GROUP 2: PRICE + STOCK (Highlight Section) */}
      <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
        {/* Price */}
        <div className="flex items-center space-x-3 mb-3">
          <span className="text-3xl lg:text-4xl font-bold text-gray-900">${product.price}</span>
          {product.compare_price && (
            <>
              <span className="text-lg text-gray-500 line-through">${product.compare_price}</span>
              <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                {Math.round(((product.compare_price - product.price) / product.compare_price) * 100)}% OFF
              </span>
            </>
          )}
        </div>

        {/* Stock Status */}
        <div className="flex items-center space-x-2">
          {product.inventory_quantity > 0 || product.allow_backorder ? (
            <>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                {product.inventory_quantity > 0 ? 'In Stock' : 'Backorder Available'}
              </div>
              {product.inventory_quantity > 0 && (
                <span className="text-sm text-gray-600">({product.inventory_quantity} available)</span>
              )}
            </>
          ) : (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              <div className="h-2 w-2 rounded-full bg-red-500 mr-2" />
              Out of Stock
            </div>
          )}
        </div>
      </div>

      {/* GROUP 3: VARIANTS */}
      {variants.colors && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Select Options</h3>
          <div className="space-y-4">
            {variants.colors && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Color</label>
                <div className="flex flex-wrap gap-3">
                  {variants.colors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => handleOptionChange('color', color)}
                      className={`w-10 h-10 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                        selectedOptions.color?.value === color.value
                          ? 'border-blue-600 ring-4 ring-blue-200 shadow-lg'
                          : 'border-gray-300 hover:border-gray-400'
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
                <label className="block text-sm font-medium text-gray-700 mb-3">Size</label>
                <div className="flex flex-wrap gap-2">
                  {variants.sizes.map((size) => (
                    <button
                      key={size.value}
                      onClick={() => handleOptionChange('size', size)}
                      className={`px-4 py-2 rounded-lg border font-medium transition-all duration-200 hover:scale-105 ${
                        selectedOptions.size?.value === size.value
                          ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-md'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
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

      {/* GROUP 4: QUANTITY + ACTIONS */}
      <div className="space-y-4">
        {/* Quantity Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Quantity</label>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleQuantityChange(-1)}
              className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-16 text-center text-lg font-semibold">{quantity}</span>
            <button
              onClick={() => handleQuantityChange(1)}
              className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleAddToCart}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            disabled={!(product.inventory_quantity > 0 || product.allow_backorder) || isAddingToCart}
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="text-lg">{isAddingToCart ? 'Adding to Cart...' : 'Add to Cart'}</span>
          </button>
          
          <button
            onClick={handleBuyNow}
            className="w-full bg-gray-800 text-white py-3 px-6 rounded-xl font-medium hover:bg-gray-900 active:bg-gray-950 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            disabled={!(product.inventory_quantity > 0 || product.allow_backorder)}
          >
            Buy Now
          </button>
          
          <button
            onClick={handleWishlist}
            className="w-full border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-3"
            disabled={isAddingToWishlist}
          >
            <Heart className={`h-5 w-5 ${isAddingToWishlist ? 'fill-red-500 text-red-500' : ''}`} />
            <span>{isAddingToWishlist ? 'Adding to Wishlist...' : 'Add to Wishlist'}</span>
          </button>
        </div>
      </div>

      {/* GROUP 5: TRUST + HIGHLIGHTS */}
      <div className="space-y-6">
        {/* Product Description */}
        {product.description && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Description</h3>
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          </div>
        )}

        {/* Trust Badges */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Why Shop With Us?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center text-center p-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Free Shipping</span>
              <span className="text-xs text-gray-600 mt-1">On orders over $50</span>
            </div>
            <div className="flex flex-col items-center text-center p-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Secure Checkout</span>
              <span className="text-xs text-gray-600 mt-1">SSL encryption</span>
            </div>
            <div className="flex flex-col items-center text-center p-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <RefreshCw className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Easy Returns</span>
              <span className="text-xs text-gray-600 mt-1">30-day policy</span>
            </div>
          </div>
        </div>

        {/* Product Highlights */}
        {product.highlights && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Key Features</h3>
            <ul className="space-y-3">
              {product.highlights.map((highlight, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-700 leading-relaxed">{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
