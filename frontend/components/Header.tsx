'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ShoppingCart, Heart, Menu, X, User } from 'lucide-react';
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useSupabaseAuth } from "../contexts/SupabaseAuthContext";
import { Button } from './ui/Button';
import { getSafeImageUrl } from '../lib/images';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); 
  const { getCartCount } = useCart();
  const { getWishlistCount } = useWishlist();
  const { isAuthenticated } = useSupabaseAuth();
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
          <Link href="/" className="flex-shrink-0 flex items-center">
            <Image
              src={getSafeImageUrl('/logo.png', '/placeholder-product.svg')}
              alt="AfroSuperstoreGhana"
              width={120}
              height={40}
              className="h-10 w-auto md:h-12 lg:h-14 transition-all duration-200 hover:opacity-80"
              priority
              loading="eager"
              unoptimized={process.env.NODE_ENV === 'production'}
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:block">
            <ul className="flex items-center space-x-8">
              <li><Link href="/products" className="text-gray-700 hover:text-indigo-600 transition-colors duration-200 font-medium">Shop</Link></li>
              <li><Link href="/auto-parts" className="text-gray-700 hover:text-indigo-600 transition-colors duration-200 font-medium">Auto Parts</Link></li>
              <li><Link href="/categories" className="text-gray-700 hover:text-indigo-600 transition-colors duration-200 font-medium">Categories</Link></li>
              <li><Link href="/deals" className="text-gray-700 hover:text-indigo-600 transition-colors duration-200 font-medium">Deals</Link></li>
              <li><Link href="/about" className="text-gray-700 hover:text-indigo-600 transition-colors duration-200 font-medium">About</Link></li>
              <li><Link href="/contact" className="text-gray-700 hover:text-indigo-600 transition-colors duration-200 font-medium">Contact</Link></li>
            </ul>
          </nav>

          {/* Search and Cart - Tablet View */}
          <div className="hidden md:flex lg:hidden items-center space-x-3">
            <Link href={isAuthenticated ? "/account" : "/login"} className="p-2 text-gray-700 hover:text-indigo-600 transition-colors duration-200 rounded-lg hover:bg-gray-100">
              <User className="h-5 w-5" />
            </Link>
            
            <Link href="/account/wishlist" className="relative p-2 text-gray-700 hover:text-indigo-600 transition-colors duration-200 rounded-lg hover:bg-gray-100">
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                  {wishlistCount}
                </span>
              )}
            </Link>
            
            <Link href="/cart" className="relative p-2 text-gray-700 hover:text-indigo-600 transition-colors duration-200 rounded-lg hover:bg-gray-100">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

          {/* Search and Cart - Desktop View */}
          <div className="hidden lg:flex items-center space-x-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-32 md:w-48 lg:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </form>
            
            <Link href={isAuthenticated ? "/account" : "/login" } className="p-2 text-gray-700 hover:text-indigo-600 transition-colors duration-200 rounded-lg hover:bg-gray-100">
              <User className="h-5 w-5" />
            </Link>
            
            <Link href="/account/wishlist" className="relative p-2 text-gray-700 hover:text-indigo-600 transition-colors duration-200 rounded-lg hover:bg-gray-100">
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                  {wishlistCount}
                </span>
              )}
            </Link>
            
            <Link href="/cart" className="relative p-2 text-gray-700 hover:text-indigo-600 transition-colors duration-200 rounded-lg hover:bg-gray-100">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <Button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              variant="ghost"
              size="icon"
              className="p-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-gray-100 transition-colors duration-200"
              aria-label="Toggle mobile menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 pt-4 pb-6 space-y-2">
              <form onSubmit={handleSearch} className="pb-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  />
                  <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                </div>
              </form>
              
              <Link href="/products" className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md transition-all duration-200 touch-target" onClick={() => setIsMenuOpen(false)}>Shop</Link>
              <Link href="/auto-parts" className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md transition-all duration-200 touch-target" onClick={() => setIsMenuOpen(false)}>Auto Parts</Link>
              <Link href="/categories" className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md transition-all duration-200 touch-target" onClick={() => setIsMenuOpen(false)}>Categories</Link>
              <Link href="/deals" className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md transition-all duration-200 touch-target" onClick={() => setIsMenuOpen(false)}>Deals</Link>
              <Link href="/about" className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md transition-all duration-200 touch-target" onClick={() => setIsMenuOpen(false)}>About</Link>
              <Link href="/contact" className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md transition-all duration-200 touch-target" onClick={() => setIsMenuOpen(false)}>Contact</Link>
              
              <div className="pt-4 pb-2 border-t border-gray-200">
                <div className="flex items-center justify-around space-x-2 px-2">
                  <Link href={isAuthenticated ? "/account" : "/login"} className="flex flex-col items-center p-3 text-gray-700 hover:text-indigo-600 transition-colors duration-200 touch-target" onClick={() => setIsMenuOpen(false)}>
                    <User className="h-6 w-6 mb-1" />
                    <span className="text-xs font-medium">Account</span>
                  </Link>
                  
                  <Link href="/account/wishlist" className="relative flex flex-col items-center p-3 text-gray-700 hover:text-indigo-600 transition-colors duration-200 touch-target" onClick={() => setIsMenuOpen(false)}>
                    <Heart className="h-6 w-6 mb-1" />
                    <span className="text-xs font-medium">Wishlist</span>
                    {wishlistCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>
                  
                  <Link href="/cart" className="relative flex flex-col items-center p-3 text-gray-700 hover:text-indigo-600 transition-colors duration-200 touch-target" onClick={() => setIsMenuOpen(false)}>
                    <ShoppingCart className="h-6 w-6 mb-1" />
                    <span className="text-xs font-medium">Cart</span>
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
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
