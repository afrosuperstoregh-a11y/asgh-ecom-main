'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ShoppingCart, Heart, Menu, X, User } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount] = useState(3); // Dummy cart count
  const [wishlistCount] = useState(7); // Dummy wishlist count

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <img src="/asca-logo.png" alt="AfroSuperstore" className="h-24 w-auto" />
            {/* <h1 className="text-2xl font-bold text-red-600">AfroSuperstore</h1> */}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <ul className="flex items-center space-x-8">
              <li><Link href="/shop" className="text-gray-700 hover:text-indigo-600 transition-colors">Shop</Link></li>
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
                className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </form>
            
            <Link href="/account" className="p-2 text-gray-700 hover:text-indigo-600 transition-colors">
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
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <form onSubmit={handleSearch} className="px-3 pb-3">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </form>
              
              <Link href="/shop" className="block px-3 py-2 text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md" onClick={() => setIsMenuOpen(false)}>Shop</Link>
              <Link href="/categories" className="block px-3 py-2 text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md" onClick={() => setIsMenuOpen(false)}>Categories</Link>
              <Link href="/deals" className="block px-3 py-2 text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md" onClick={() => setIsMenuOpen(false)}>Deals</Link>
              <Link href="/about" className="block px-3 py-2 text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md" onClick={() => setIsMenuOpen(false)}>About</Link>
              <Link href="/contact" className="block px-3 py-2 text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md" onClick={() => setIsMenuOpen(false)}>Contact</Link>
              
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="flex items-center space-x-4 px-3">
                  <Link href="/account" className="p-2 text-gray-700 hover:text-indigo-600 transition-colors" onClick={() => setIsMenuOpen(false)}>
                    <User className="h-6 w-6" />
                  </Link>
                  
                  <Link href="/account/wishlist" className="relative p-2 text-gray-700 hover:text-indigo-600 transition-colors" onClick={() => setIsMenuOpen(false)}>
                    <Heart className="h-6 w-6" />
                    {wishlistCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>
                  
                  <Link href="/cart" className="relative p-2 text-gray-700 hover:text-indigo-600 transition-colors" onClick={() => setIsMenuOpen(false)}>
                    <ShoppingCart className="h-6 w-6" />
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
