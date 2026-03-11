'use client';

import Link from 'next/link';
import { ArrowRight, ShoppingBag, Star, Truck, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import ShopByCategory from '@/components/ShopByCategory';

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch real products from API
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      console.log('Fetching products from: /api/products');
      const response = await fetch('/api/products?limit=6', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Response Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Failed to fetch products: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Products API response:', data);
      
      if (data.success && data.data?.products) {
        const transformedProducts = data.data.products.map((product: any) => ({
          id: parseInt(product.id),
          name: product.name,
          price: parseFloat(product.price),
          originalPrice: product.compare_price ? parseFloat(product.compare_price) : undefined,
          image: product.images && product.images.length > 0 ? product.images[0] : '/placeholder-product.svg',
          category: product.categories?.name || 'Premium',
          rating: Math.floor(Math.random() * 2) + 3, // Mock rating
          reviews: Math.floor(Math.random() * 100) + 10, // Mock reviews
          inventory_quantity: product.inventory_quantity || 0,
          track_inventory: product.track_inventory || false,
          allow_backorder: product.allow_backorder || false,
        }));
        setProducts(transformedProducts);
      } else {
        console.warn('Unexpected API response format:', data);
        // Fallback to mock data
        const mockProducts = [
          { id: 1, name: 'Girls Dashiki', price: 39.99, image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/girls-dashiki.svg', category: 'Women Fashion', inventory_quantity: 15, track_inventory: true, allow_backorder: false },
          { id: 2, name: 'Boys Dashiki', price: 35.99, image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/boys-dashiki.svg', category: 'Men Fashion', inventory_quantity: 8, track_inventory: true, allow_backorder: false },
          { id: 3, name: 'Banku Flour', price: 25.99, image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/banku-flour.svg', category: 'Food', inventory_quantity: 25, track_inventory: true, allow_backorder: true },
        ];
        setProducts(mockProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      // Fallback to mock data
      const mockProducts = [
        { id: 1, name: 'Girls Dashiki', price: 39.99, image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/girls-dashiki.svg', category: 'Women Fashion', inventory_quantity: 15, track_inventory: true, allow_backorder: false },
        { id: 2, name: 'Boys Dashiki', price: 35.99, image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/boys-dashiki.svg', category: 'Men Fashion', inventory_quantity: 8, track_inventory: true, allow_backorder: false },
        { id: 3, name: 'Banku Flour', price: 25.99, image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/banku-flour.svg', category: 'Food', inventory_quantity: 25, track_inventory: true, allow_backorder: true },
      ];
      setProducts(mockProducts);
    } finally {
      setLoading(false);
    }
  };

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

      {/* Featured Products */}
      {!loading && products.length > 0 && (
        <section className="py-12 md:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
              <p className="text-base md:text-lg text-gray-600 px-4">Check out our handpicked selection</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              {products.map((product: any) => (
                <div key={product.id} className="group">
                  <Link href={`/product/${product.id}`} className="block">
                    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
                      <div className="aspect-square bg-gray-100 overflow-hidden">
                        <img
                          src={product.image || '/placeholder-product.svg'}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4 md:p-6">
                        <div className="text-sm text-gray-500 uppercase tracking-wide mb-2">{product.category || 'Premium'}</div>
                        <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                        <div className="flex items-center space-x-1 mb-3">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.floor(product.rating || 0)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">({product.reviews || 0})</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-xl md:text-2xl font-bold text-gray-900">${product.price}</span>
                            {product.originalPrice && (
                              <span className="text-sm text-gray-500 line-through">
                                ${product.originalPrice}
                              </span>
                            )}
                          </div>
                          {product.discount && (
                            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">
                              {product.discount}% OFF
                            </span>
                          )}
                        </div>
                        {/* Stock Status */}
                        <div className="text-xs text-gray-600 mt-2">
                          {(product.inventory_quantity > 0 || product.allow_backorder) ? (
                            <span className="text-green-600">
                              {product.inventory_quantity >= 10 ? `${product.inventory_quantity} in stock` : 'Available'}
                            </span>
                          ) : (
                            <span className="text-red-600">Out of Stock</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
            <div className="text-center mt-8 md:mt-12">
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 touch-target"
              >
                View All Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
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
