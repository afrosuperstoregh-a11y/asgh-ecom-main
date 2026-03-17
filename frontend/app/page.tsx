'use client';

// PRODUCTION FIX: Safe Supabase initialization - Deploy: 1227d5c - Mar 15, 2025

import Link from 'next/link';
import { ArrowRight, ShoppingBag, Star, Truck, Shield } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import ShopByCategory from '@/components/ShopByCategory';
import FeaturedProductCard from '@/components/FeaturedProductCard';

export default function HomePage() {
  const { products, loading, error } = useProducts({ limit: 200 });
  useCategories();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-red-600 to-yellow-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-24">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">
              Welcome to Afro Superstore
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 text-blue-100 px-4">
              Discover amazing products at unbeatable prices
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-6 md:px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200 touch-target"
              >
                Start Shopping
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/deals"
                className="inline-flex items-center justify-center px-6 md:px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors duration-200 touch-target"
              >
                View Deals
                <ShoppingBag className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Shop by Category Section */}
      <ShopByCategory />

      {/* All Products */}
      {!loading && (
        <section className="py-12 md:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">All Products</h2>
              <p className="text-base md:text-lg text-gray-600 px-4">Browse our complete collection of {products.length} authentic African products</p>
              {error && (
                <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                  <p className="text-sm">Using cached data: {error}</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {products.map((product: any) => (
                <FeaturedProductCard key={product.id} product={product} />
              ))}
            </div>
            {products.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-gray-500">No products found.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Why Shop With Us?</h2>
            <p className="text-base md:text-lg text-gray-600 px-4">We offer the best shopping experience</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center p-4 md:p-6 bg-white rounded-lg shadow-sm">
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-blue-100 rounded-full mb-4">
                <Truck className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">Free Shipping</h3>
              <p className="text-sm md:text-base text-gray-600">Free shipping on all orders over $50</p>
            </div>
            <div className="text-center p-4 md:p-6 bg-white rounded-lg shadow-sm">
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-blue-100 rounded-full mb-4">
                <Shield className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">Secure Payment</h3>
              <p className="text-sm md:text-base text-gray-600">100% secure payment processing</p>
            </div>
            <div className="text-center p-4 md:p-6 bg-white rounded-lg shadow-sm">
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-blue-100 rounded-full mb-4">
                <Star className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">Quality Guarantee</h3>
              <p className="text-sm md:text-base text-gray-600">Premium quality products guaranteed</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ShoppingBag className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Shop?</h2>
          <p className="text-lg md:text-xl mb-6 md:mb-8 px-4">
            Browse our curated collection of premium products
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-6 md:px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200 touch-target"
            >
              Browse Products
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/deals"
              className="inline-flex items-center justify-center px-6 md:px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors duration-200 touch-target"
            >
              Hot Deals
              <ShoppingBag className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
