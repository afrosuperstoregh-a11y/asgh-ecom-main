'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const AccountWishlistPage = () => {
  const [wishlistItems, setWishlistItems] = useState([
    {
      id: 1,
      name: 'Wireless Bluetooth Headphones',
      price: 79.99,
      originalPrice: 99.99,
      image: '/placeholder-product.svg',
      rating: 4.5,
      reviews: 234,
      inStock: true,
      addedDate: '2024-01-10',
      category: 'Electronics',
      brand: 'AudioTech',
      discount: 20
    },
    {
      id: 2,
      name: 'Smart Watch Series 5',
      price: 129.99,
      originalPrice: 149.99,
      image: '/placeholder-product.svg',
      rating: 4.3,
      reviews: 189,
      inStock: true,
      addedDate: '2024-01-08',
      category: 'Electronics',
      brand: 'TechWatch',
      discount: 13
    },
    {
      id: 3,
      name: 'Laptop Stand Aluminum',
      price: 45.00,
      originalPrice: 45.00,
      image: '/placeholder-product.svg',
      rating: 4.7,
      reviews: 567,
      inStock: false,
      addedDate: '2024-01-05',
      category: 'Accessories',
      brand: 'ComfortPlus',
      discount: 0
    },
    {
      id: 4,
      name: 'Mechanical Keyboard RGB',
      price: 89.99,
      originalPrice: 119.99,
      image: '/placeholder-product.svg',
      rating: 4.6,
      reviews: 445,
      inStock: true,
      addedDate: '2024-01-03',
      category: 'Electronics',
      brand: 'KeyMaster',
      discount: 25
    },
    {
      id: 5,
      name: 'Wireless Mouse Ergonomic',
      price: 35.99,
      originalPrice: 45.99,
      image: '/placeholder-product.svg',
      rating: 4.4,
      reviews: 298,
      inStock: true,
      addedDate: '2024-01-01',
      category: 'Electronics',
      brand: 'MousePro',
      discount: 22
    },
    {
      id: 6,
      name: 'USB-C Hub 7-in-1',
      price: 29.99,
      originalPrice: 39.99,
      image: '/placeholder-product.svg',
      rating: 4.2,
      reviews: 156,
      inStock: true,
      addedDate: '2023-12-28',
      category: 'Accessories',
      brand: 'HubTech',
      discount: 25
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState('all-products');
  const [sortBy, setSortBy] = useState('dateAdded');

  const categories = ['all-products', ...new Set(wishlistItems.map(item => item.category).filter(cat => cat !== 'all-products'))];

  const filteredAndSortedItems = wishlistItems
    .filter(item => selectedCategory === 'all-products' || item.category === selectedCategory)
    .sort((a, b) => {
      // Defensive guards for sorting
      if (!a || !b) return 0;
      
      switch (sortBy) {
        case 'priceLow':
          return (a.price || 0) - (b.price || 0);
        case 'priceHigh':
          return (b.price || 0) - (a.price || 0);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'dateAdded':
        default:
          return new Date(b.addedDate || Date.now()).getTime() - new Date(a.addedDate || Date.now()).getTime();
      }
    });

  const removeFromWishlist = (itemId: number) => {
    setWishlistItems(prev => prev.filter(item => item.id !== itemId));
  };

  const addToCart = (itemId: number) => {
    // Simulate adding to cart
    alert('Item added to cart!');
    removeFromWishlist(itemId);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <svg key="half" className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0v15z" />
        </svg>
      );
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg key={`empty-${i}`} className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      );
    }
    
    return stars;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
          <p className="text-gray-600 mt-2">Items you have saved for later</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow-lg rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-bold text-lg">JD</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">John Doe</h3>
                  <p className="text-sm text-gray-600">john@example.com</p>
                </div>
              </div>

              <nav className="space-y-1">
                <Link href="/account" className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Account Overview</span>
                </Link>
                
                <Link href="/account/profile" className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Profile Information</span>
                </Link>
                
                <Link href="/account/orders" className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span>Order History</span>
                </Link>
                
                <Link href="/account/wishlist" className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium bg-indigo-50 text-indigo-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>Wishlist</span>
                </Link>
                
                <Link href="/account/addresses" className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Addresses</span>
                </Link>
                
                <Link href="/account/payment-methods" className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span>Payment Methods</span>
                </Link>
                
                <Link href="/account/settings" className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Settings</span>
                </Link>
              </nav>
            </div>

            {/* Filters */}
            <div className="bg-white shadow-lg rounded-lg p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === 'all-products' ? 'All Categories' : category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="dateAdded">Date Added</option>
                    <option value="priceLow">Price: Low to High</option>
                    <option value="priceHigh">Price: High to Low</option>
                    <option value="name">Name</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white shadow-lg rounded-lg p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Wishlist Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Items:</span>
                  <span className="font-medium">{wishlistItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Value:</span>
                  <span className="font-medium">
                    ${wishlistItems.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">In Stock:</span>
                  <span className="font-medium">
                    {wishlistItems.filter(item => item.inStock).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">On Sale:</span>
                  <span className="font-medium">
                    {wishlistItems.filter(item => item.discount > 0).length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {filteredAndSortedItems.length === 0 ? (
              <div className="bg-white shadow-lg rounded-lg p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No items in wishlist</h3>
                <p className="mt-2 text-gray-600">Start adding items you love to your wishlist!</p>
                <div className="mt-6">
                  <Link href="/products" className="bg-indigo-600 text-white px-6 py-3 rounded-md font-medium hover:bg-indigo-700">
                    Browse Products
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedItems.filter(item => item && item.id).map((item) => (
                  <div key={item.id} className="bg-white shadow-lg rounded-lg overflow-hidden group hover:shadow-xl transition-shadow w-[275px] h-[375px] flex flex-col">
                    <div className="relative flex-shrink-0 overflow-hidden rounded-t-lg" style={{ height: '200px' }}>
                      <img
                        src={item.image || '/placeholder-product.jpg'}
                        alt={item.name || 'Product'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                        }}
                      />
                      {item.discount > 0 && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                          -{item.discount}%
                        </div>
                      )}
                      {!item.inStock && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="text-white font-medium">Out of Stock</span>
                        </div>
                      )}
                      <button
                        onClick={() => removeFromWishlist(item.id)}
                        className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="p-4 flex-1 flex flex-col justify-between overflow-hidden">
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 overflow-hidden">{item.name || 'Unnamed Product'}</h3>
                        
                        <div className="flex items-center mb-2">
                          <div className="flex items-center">
                            {renderStars(item.rating)}
                          </div>
                          <span className="text-sm text-gray-600 ml-2">({item.reviews})</span>
                        </div>

                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="text-lg font-bold text-gray-900">${item.price.toFixed(2)}</div>
                            {item.originalPrice > item.price && (
                              <div className="text-sm text-gray-500 line-through">
                                ${item.originalPrice.toFixed(2)}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {item.category}
                          </span>
                        </div>

                        <div className="text-xs text-gray-500 mb-3">
                          Added on {new Date(item.addedDate).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-auto">
                        <button
                          onClick={() => addToCart(item.id)}
                          disabled={!item.inStock}
                          className="flex-1 bg-indigo-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {item.inStock ? 'Add to Cart' : 'Out of Stock'}
                        </button>
                        <button className="p-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountWishlistPage;
