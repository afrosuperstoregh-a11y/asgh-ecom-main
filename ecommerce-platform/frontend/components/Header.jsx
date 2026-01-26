'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, ShoppingCart, User, Menu, X } from 'lucide-react';
import { useCart } from "../contexts/CartContext";
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

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <h1 className="text-xl sm:text-2xl font-bold text-primary-600">Afro Superstore</h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            <Link href="/" className={`${pathname === '/' ? 'text-primary-600' : 'text-gray-700'} hover:text-primary-600 transition-colors text-sm xl:text-base`}>
              Home
            </Link>
            <Link href="/products" className={`${pathname.startsWith('/products') ? 'text-primary-600' : 'text-gray-700'} hover:text-primary-600 transition-colors text-sm xl:text-base`}>
              Products
            </Link>
            <Link href="/categories" className={`${pathname.startsWith('/categories') ? 'text-primary-600' : 'text-gray-700'} hover:text-primary-600 transition-colors text-sm xl:text-base`}>
              Categories
            </Link>
            <Link href="/deals" className={`${pathname === '/deals' ? 'text-primary-600' : 'text-gray-700'} hover:text-primary-600 transition-colors text-sm xl:text-base`}>
              Deals
            </Link>
            <Link href="/about" className={`${pathname === '/about' ? 'text-primary-600' : 'text-gray-700'} hover:text-primary-600 transition-colors text-sm xl:text-base`}>
              About
            </Link>
          </nav>

          {/* Desktop Search */}
          <div className="hidden xl:flex flex-1 max-w-lg mx-6">
            <form onSubmit={handleSearch} className="relative w-full">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </form>
          </div>

          {/* Right Icons */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {isAuthenticated ? (
              <div className="hidden sm:flex items-center space-x-2">
                <span className="text-xs sm:text-sm text-gray-600 truncate max-w-20 sm:max-w-none">Hi, {user?.name}</span>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-700 hover:text-primary-600 transition-colors touch-target"
                  title="Logout"
                >
                  <User className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link href="/auth/login" className="p-2 text-gray-700 hover:text-primary-600 transition-colors touch-target">
                <User className="h-5 w-5" />
              </Link>
            )}
            <Link href="/cart" className="p-2 text-gray-700 hover:text-primary-600 transition-colors relative touch-target">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:text-primary-600 transition-colors touch-target"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search - Always visible on mobile */}
        <div className="lg:hidden pb-3">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </form>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-white z-50">
          <div className="flex flex-col h-full p-4 sm:p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Menu</h2>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-md text-gray-500 hover:bg-gray-100 touch-target"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <nav className="flex-1 flex flex-col space-y-4 overflow-y-auto">
              <Link href="/" className={`text-base sm:text-lg ${pathname === '/' ? 'text-primary-600' : 'text-gray-700'} py-2`} onClick={() => setIsMobileMenuOpen(false)}>
                Home
              </Link>
              <Link href="/products" className={`text-base sm:text-lg ${pathname.startsWith('/products') ? 'text-primary-600' : 'text-gray-700'} py-2`} onClick={() => setIsMobileMenuOpen(false)}>
                Products
              </Link>
              <Link href="/categories" className={`text-base sm:text-lg ${pathname.startsWith('/categories') ? 'text-primary-600' : 'text-gray-700'} py-2`} onClick={() => setIsMobileMenuOpen(false)}>
                Categories
              </Link>
              <Link href="/deals" className={`text-base sm:text-lg ${pathname === '/deals' ? 'text-primary-600' : 'text-gray-700'} py-2`} onClick={() => setIsMobileMenuOpen(false)}>
                Deals
              </Link>
              <Link href="/about" className={`text-base sm:text-lg ${pathname === '/about' ? 'text-primary-600' : 'text-gray-700'} py-2`} onClick={() => setIsMobileMenuOpen(false)}>
                About
              </Link>
            </nav>
            
            <div className="pt-4 border-t border-gray-200 space-y-4">
              {isAuthenticated ? (
                <div className="space-y-3">
                  <div className="text-center text-gray-600 text-sm sm:text-base">Hi, {user?.name}</div>
                  <button 
                    onClick={handleLogout}
                    className="mobile-button text-red-600 border border-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link href="/auth/login" className="mobile-button text-primary-600 border border-primary-600 hover:bg-primary-50" onClick={() => setIsMobileMenuOpen(false)}>
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
