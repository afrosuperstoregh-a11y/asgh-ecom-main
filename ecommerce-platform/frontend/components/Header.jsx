'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, ShoppingCart, User, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const { getCartCount } = useCart();
  const { user, logout, isAuthenticated } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    setCartCount(getCartCount());
  }, [getCartCount]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <h1 className="text-2xl font-bold text-primary-600">Afro Superstore</h1>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className={`${pathname === '/' ? 'text-primary-600' : 'text-gray-700'} hover:text-primary-600 transition-colors`}>
              Home
            </Link>
            <Link href="/products" className={`${pathname.startsWith('/products') ? 'text-primary-600' : 'text-gray-700'} hover:text-primary-600 transition-colors`}>
              Products
            </Link>
            <Link href="/categories" className={`${pathname.startsWith('/categories') ? 'text-primary-600' : 'text-gray-700'} hover:text-primary-600 transition-colors`}>
              Categories
            </Link>
            <Link href="/deals" className={`${pathname === '/deals' ? 'text-primary-600' : 'text-gray-700'} hover:text-primary-600 transition-colors`}>
              Deals
            </Link>
            <Link href="/about" className={`${pathname === '/about' ? 'text-primary-600' : 'text-gray-700'} hover:text-primary-600 transition-colors`}>
              About
            </Link>
          </nav>

          {/* Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </form>
          </div>

          {/* Right Icons */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Hi, {user?.name}</span>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-700 hover:text-primary-600 transition-colors"
                  title="Logout"
                >
                  <User className="h-6 w-6" />
                </button>
              </div>
            ) : (
              <Link href="/auth/login" className="p-2 text-gray-700 hover:text-primary-600 transition-colors">
                <User className="h-6 w-6" />
              </Link>
            )}
            <Link href="/cart" className="p-2 text-gray-700 hover:text-primary-600 transition-colors relative">
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-primary-600 transition-colors"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden fixed inset-0 bg-white z-50 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
          <div className="flex flex-col h-full p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Menu</h2>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 flex flex-col space-y-4">
              <Link href="/" className={`text-lg ${pathname === '/' ? 'text-primary-600' : 'text-gray-700'}`} onClick={() => setIsMobileMenuOpen(false)}>
                Home
              </Link>
              <Link href="/products" className={`text-lg ${pathname.startsWith('/products') ? 'text-primary-600' : 'text-gray-700'}`} onClick={() => setIsMobileMenuOpen(false)}>
                Products
              </Link>
              <Link href="/categories" className={`text-lg ${pathname.startsWith('/categories') ? 'text-primary-600' : 'text-gray-700'}`} onClick={() => setIsMobileMenuOpen(false)}>
                Categories
              </Link>
              <Link href="/deals" className={`text-lg ${pathname === '/deals' ? 'text-primary-600' : 'text-gray-700'}`} onClick={() => setIsMobileMenuOpen(false)}>
                Deals
              </Link>
              <Link href="/about" className={`text-lg ${pathname === '/about' ? 'text-primary-600' : 'text-gray-700'}`} onClick={() => setIsMobileMenuOpen(false)}>
                About
              </Link>
            </nav>
            
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </form>
            
            <div className="pt-4 border-t border-gray-200">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="text-center text-gray-600">Hi, {user?.name}</div>
                  <button 
                    onClick={handleLogout}
                    className="block w-full px-4 py-2 text-center text-red-600 border border-red-600 rounded-lg hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link href="/auth/login" className="block w-full px-4 py-2 text-center text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50" onClick={() => setIsMobileMenuOpen(false)}>
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile Search - Only shown when menu is closed */}
        {!isMobileMenuOpen && (
          <div className="md:hidden pb-3">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
