'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ShoppingCart, Heart, Menu, X, User } from 'lucide-react';
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../contexts/AuthContext";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { getCartCount } = useCart();
  const { getWishlistCount } = useWishlist();
  const { isAuthenticated } = useAuth();
  const cartCount = getCartCount();
  const wishlistCount = getWishlistCount();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Use Next.js router for navigation instead of window.location
      const searchUrl = `/shop?search=${encodeURIComponent(searchQuery.trim())}`;
      window.location.href = searchUrl;
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image 
              src="/logo.png" 
              alt="AfroSuperstore" 
              width={96}
              height={96}
              className="h-12 w-auto md:h-16 lg:h-24"
              priority
              unoptimized={process.env.NODE_ENV === 'production'}
              onError={(e) => {
                // Fallback to regular img if Next.js Image fails
                const target = e.target as HTMLImageElement;
                const fallbackImg = document.createElement('img');
                fallbackImg.src = '/logo.png';
                fallbackImg.alt = 'AfroSuperstore';
                fallbackImg.className = 'h-12 w-auto md:h-16 lg:h-24';
                target.parentNode?.replaceChild(fallbackImg, target);
              }}
            />
            {/* <h1 className="text-2xl font-bold text-red-600">AfroSuperstore</h1> */}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <ul className="flex items-center space-x-8">
              <li><Link href="/products" className="text-gray-700 hover:text-indigo-600 transition-colors">Shop</Link></li>
              <li><Link href="/categories" className="text-gray-700 hover:text-indigo-600 transition-colors">Categories</Link></li>
              <li><Link href="/deals" className="text-gray-700 hover:text-indigo-600 transition-colors">Deals</Link></li>
              <li><Link href="/about" className="text-gray-700 hover:text-indigo-600 transition-colors">About</Link></li>
              <li><Link href="/contact" className="text-gray-700 hover:text-indigo-600 transition-colors">Contact</Link></li>
            </ul>
          </nav>

          {/* Search and Cart */}
          <div className="hidden md:flex items-center space-x-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-32 md:w-48 lg:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </form>
            
            <Link href={isAuthenticated ? "/account" : "/login"} className="p-2 text-gray-700 hover:text-indigo-600 transition-colors">
              <User className="h-6 w-6" />
            </Link>
            
            <Link href="/account/wishlist" className="relative p-2 text-gray-700 hover:text-indigo-600 transition-colors">
              <Heart className="h-6 w-6" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>
            
            <Link href="/cart" className="relative p-2 text-gray-700 hover:text-indigo-600 transition-colors">
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-gray-100"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 pt-4 pb-6 space-y-2">
              <form onSubmit={handleSearch} className="pb-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                </div>
              </form>
              
              <Link href="/products" className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md touch-target" onClick={() => setIsMenuOpen(false)}>Shop</Link>
              <Link href="/categories" className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md touch-target" onClick={() => setIsMenuOpen(false)}>Categories</Link>
              <Link href="/deals" className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md touch-target" onClick={() => setIsMenuOpen(false)}>Deals</Link>
              <Link href="/about" className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md touch-target" onClick={() => setIsMenuOpen(false)}>About</Link>
              <Link href="/contact" className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md touch-target" onClick={() => setIsMenuOpen(false)}>Contact</Link>
              
              <div className="pt-4 pb-2 border-t border-gray-200">
                <div className="flex items-center justify-around space-x-2 px-2">
                  <Link href={isAuthenticated ? "/account" : "/login"} className="flex flex-col items-center p-3 text-gray-700 hover:text-indigo-600 transition-colors touch-target" onClick={() => setIsMenuOpen(false)}>
                    <User className="h-6 w-6 mb-1" />
                    <span className="text-xs">Account</span>
                  </Link>
                  
                  <Link href="/account/wishlist" className="relative flex flex-col items-center p-3 text-gray-700 hover:text-indigo-600 transition-colors touch-target" onClick={() => setIsMenuOpen(false)}>
                    <Heart className="h-6 w-6 mb-1" />
                    <span className="text-xs">Wishlist</span>
                    {wishlistCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>
                  
                  <Link href="/cart" className="relative flex flex-col items-center p-3 text-gray-700 hover:text-indigo-600 transition-colors touch-target" onClick={() => setIsMenuOpen(false)}>
                    <ShoppingCart className="h-6 w-6 mb-1" />
                    <span className="text-xs">Cart</span>
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
